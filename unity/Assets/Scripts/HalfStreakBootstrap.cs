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
            PanelSettings panelSettings = ScriptableObject.CreateInstance<PanelSettings>();
            panelSettings.scaleMode = PanelScaleMode.ScaleWithScreenSize;
            panelSettings.referenceResolution = new Vector2Int(1920, 1080);
            document.panelSettings = panelSettings;
            document.enabled = false;
            document.visualTreeAsset = layout;
            document.enabled = true;
            if (style != null && document.rootVisualElement != null)
                document.rootVisualElement.styleSheets.Add(style);
            host.AddComponent<HalfStreakController>();
        }
    }
}
