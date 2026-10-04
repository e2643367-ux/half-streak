using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UIElements;

namespace HalfStreak
{
    public sealed class HalfStreakController : MonoBehaviour
    {
        private const string BestKey = "half-streak-best";
        private const int DotCount = 8;

        [SerializeField] private UIDocument document;

        private VisualElement root;
        private VisualElement leftField;
        private VisualElement rightField;
        private VisualElement feedback;
        private VisualElement status;
        private VisualElement streakValue;
        private VisualElement bestValue;
        private VisualElement dots;
        private VisualElement confettiLayer;
        private Button leftButton;
        private Button rightButton;

        private Choice answer;
        private Phase phase;
        private int streak;
        private int best;
        private Coroutine feedbackRoutine;
        private Coroutine confettiRoutine;
        private Action leftHandler;
        private Action rightHandler;
        private bool initialized;

        private enum Choice { Left, Right }
        private enum Phase { Playing, Failed }

        private void Awake()
        {
            if (document == null) document = GetComponent<UIDocument>();
        }

        private IEnumerator Start()
        {
            // UIDocumentのvisualTreeAssetが実体化されるフレームまで待つ。
            yield return null;
            root = document.rootVisualElement;
            while (root == null || root.Q<Button>("left-choice") == null)
            {
                yield return null;
                root = document.rootVisualElement;
            }
            leftButton = root.Q<Button>("left-choice");
            rightButton = root.Q<Button>("right-choice");
            // left-field/right-field are USS classes, not UXML names. Reuse the buttons as fields.
            leftField = leftButton;
            rightField = rightButton;
            feedback = root.Q<VisualElement>("feedback");
            status = root.Q<VisualElement>("status");
            streakValue = root.Q<VisualElement>("streak-value");
            bestValue = root.Q<VisualElement>("best-value");
            dots = root.Q<VisualElement>("streak-dots");
            confettiLayer = root.Q<VisualElement>("confetti-layer");

            if (leftButton == null || rightButton == null || feedback == null || status == null ||
                streakValue == null || bestValue == null || dots == null || confettiLayer == null)
            {
                Debug.LogError("HALF STREAK: HalfStreak.uxmlの必須要素が見つかりません。UXMLのname属性を確認してください。");
                enabled = false;
                return;
            }

            leftHandler = () => Choose(Choice.Left);
            rightHandler = () => Choose(Choice.Right);
            leftButton.clicked += leftHandler;
            rightButton.clicked += rightHandler;
            best = PlayerPrefs.GetInt(BestKey, 0);
            streak = 0;
            initialized = true;
            BeginRound(false);
        }

        private void OnDestroy()
        {
            if (leftButton != null && leftHandler != null) leftButton.clicked -= leftHandler;
            if (rightButton != null && rightHandler != null) rightButton.clicked -= rightHandler;
        }

        private void Update()
        {
            if (!initialized) return;
            if (Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetKeyDown(KeyCode.A)) Choose(Choice.Left);
            if (Input.GetKeyDown(KeyCode.RightArrow) || Input.GetKeyDown(KeyCode.D)) Choose(Choice.Right);
        }

        private void BeginRound(bool keepFeedback)
        {
            phase = Phase.Playing;
            answer = Random.value < 0.5f ? Choice.Left : Choice.Right;
            leftField.RemoveFromClassList("is-hovered");
            rightField.RemoveFromClassList("is-hovered");
            status.Q<Label>("status-copy").text = "どちらを選ぶ？";
            if (!keepFeedback)
            {
                feedback.RemoveFromClassList("is-visible");
                feedback.Q<Label>("feedback-copy").text = string.Empty;
            }
            UpdateHud();
        }

        private void Choose(Choice choice)
        {
            if (phase == Phase.Failed)
            {
                streak = 0;
                BeginRound(false);
            }
            if (phase != Phase.Playing) return;

            VisualElement selected = choice == Choice.Left ? leftField : rightField;
            selected.AddToClassList("is-selected");
            StartCoroutine(RemoveClassAfter(selected, "is-selected", 0.16f));

            if (choice == answer)
            {
                streak++;
                if (streak > best)
                {
                    best = streak;
                    PlayerPrefs.SetInt(BestKey, best);
                    PlayerPrefs.Save();
                }
                int tier = GetMilestoneTier();
                string message = tier > 0 ? $"{streak} STREAK!" : streak > 1 ? $"{streak} STREAK" : "NICE!";
                ShowFeedback(message, tier);
                status.Q<Label>("status-copy").text = tier > 0 ? $"{streak}連勝！ 次も選べ" : "次の半分を選べ";
                UpdateHud();
                PlayConfetti(choice, tier);
                BeginRound(true);
            }
            else
            {
                phase = Phase.Failed;
                string winningSide = answer == Choice.Left ? "左" : "右";
                ShowFeedback("MISS", 0);
                status.Q<Label>("status-copy").text = $"正解は「{winningSide}」　もう一度選べ";
                UpdateHud();
            }
        }

        private void UpdateHud()
        {
            streakValue.Q<Label>("streak-number").text = streak.ToString("00");
            bestValue.Q<Label>("best-number").text = best.ToString("00");
            dots.Clear();
            for (int i = 0; i < DotCount; i++)
            {
                Label dot = new Label(i < Mathf.Min(streak, DotCount) ? "●" : "○");
                dot.AddToClassList("streak-dot");
                if (i < Mathf.Min(streak, DotCount)) dot.AddToClassList("is-on");
                dots.Add(dot);
            }
        }

        private void ShowFeedback(string message, int tier)
        {
            feedback.Q<Label>("feedback-copy").text = message;
            feedback.RemoveFromClassList("tier-one");
            feedback.RemoveFromClassList("tier-two");
            if (tier == 1) feedback.AddToClassList("tier-one");
            if (tier == 2) feedback.AddToClassList("tier-two");
            feedback.AddToClassList("is-visible");
            if (feedbackRoutine != null) StopCoroutine(feedbackRoutine);
            feedbackRoutine = StartCoroutine(HideFeedback(0.75f + tier * 0.35f));
        }

        private IEnumerator HideFeedback(float seconds)
        {
            yield return new WaitForSeconds(seconds);
            feedback.RemoveFromClassList("is-visible");
        }

        private void PlayConfetti(Choice choice, int tier)
        {
            if (confettiRoutine != null) StopCoroutine(confettiRoutine);
            confettiRoutine = StartCoroutine(Confetti(choice, tier));
        }

        private IEnumerator Confetti(Choice choice, int tier)
        {
            int count = 12 + tier * 8;
            float origin = choice == Choice.Left ? 25f : 75f;
            for (int i = 0; i < count; i++)
            {
                VisualElement piece = new VisualElement();
                piece.AddToClassList(i % 2 == 0 ? "confetti-lime" : "confetti-paper");
                piece.style.left = Length.Percent(origin + Random.Range(-5f, 5f));
                piece.style.top = Length.Percent(48f + Random.Range(-4f, 4f));
                confettiLayer.Add(piece);
                StartCoroutine(AnimatePiece(piece, Random.Range(-18f, 18f), Random.Range(-44f, -24f), 0.55f + tier * 0.2f));
            }
            yield return null;
        }

        private IEnumerator AnimatePiece(VisualElement piece, float x, float y, float duration)
        {
            float elapsed = 0f;
            float startX = piece.resolvedStyle.left;
            float startY = piece.resolvedStyle.top;
            while (elapsed < duration)
            {
                elapsed += Time.deltaTime;
                float t = Mathf.Clamp01(elapsed / duration);
                piece.style.left = Length.Percent(startX + x * t);
                piece.style.top = Length.Percent(startY + y * t + 42f * t * t);
                piece.style.opacity = 1f - t;
                yield return null;
            }
            piece.RemoveFromHierarchy();
        }

        private IEnumerator RemoveClassAfter(VisualElement element, string className, float seconds)
        {
            yield return new WaitForSeconds(seconds);
            element.RemoveFromClassList(className);
        }

        private int GetMilestoneTier()
        {
            if (streak % 5 == 0) return 2;
            if (streak % 3 == 0) return 1;
            return 0;
        }
    }
}
