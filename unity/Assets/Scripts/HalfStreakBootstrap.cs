using UnityEngine;
using UnityEngine.UIElements;

namespace HalfStreak
{
    public static class HalfStreakBootstrap
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static void CreateGame()
        {
            if (Object.FindObjectOfType<HalfStreakController>() != null) return;

            VisualTreeAsset layout = Resources.Load<VisualTreeAsset>("HalfStreak");
            StyleSheet style = Resources.Load<StyleSheet>("HalfStreak");
            if (layout == null)
            {
                Debug.LogError("HALF STREAK: Assets/Resources/HalfStreak.uxml が見つかりません。");
                return;
            }

            GameObject host = new GameObject("HALF STREAK UI");
            Object.DontDestroyOnLoad(host);
            UIDocument document = host.AddComponent<UIDocument>();
            document.visualTreeAsset = layout;
            if (style != null) document.rootVisualElement.styleSheets.Add(style);
            host.AddComponent<HalfStreakController>();
        }
    }
}
