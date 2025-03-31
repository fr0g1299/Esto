import { useEffect, useRef } from "react";

export const useTabBarScrollEffect = () => {
  const lastScroll = useRef(0);
  const accumulated = useRef(0);
  const justShown = useRef(false);
  const hidden = useRef(false);

  useEffect(() => {
    const content = document.querySelector("ion-content");
    const tabBar = document.querySelector("ion-tab-bar");

    if (!content || !tabBar) return;

    // Toggle CSS classes of the tab bar based on scroll/click actions
    const toggleTabBar = (show: boolean) => {
      tabBar.classList.toggle("tabbar-hidden", !show);
      tabBar.classList.toggle("tabbar-shown", show);
      hidden.current = !show;
      accumulated.current = 0;
    };

    // Handles scroll to determine whether to show or hide the tab bar
    const handleScroll = (e: CustomEvent<{ scrollTop: number }>) => {
      const current = e.detail.scrollTop;
      const delta = current - lastScroll.current;
      lastScroll.current = current;

      // Determine if the user is continuing in the same scroll direction
      const sameDirection =
        (delta > 0 && !hidden.current) || (delta < 0 && hidden.current);

      // Accumulate scrolling distance in one direction; reset if direction changes
      accumulated.current = sameDirection ? accumulated.current + delta : delta;

      // Hide tab bar if user scrolls down 100px
      if (!hidden.current && accumulated.current > 100) {
        toggleTabBar(false);
      }

      // Show tab bar if user scrolls up 100px
      if (hidden.current && accumulated.current < -100) {
        toggleTabBar(true);
      }
    };

    // If user taps the tab bar while it's hidden, show it manually
    const handleClick = (e: Event) => {
      if (hidden.current) {
        e.preventDefault(); // Prevent interaction when hidden
        e.stopPropagation(); // Stop click from propagating

        toggleTabBar(true); // Show the tab bar
        justShown.current = true;

        // Reset justShown flag after short delay to avoid instant hide
        setTimeout(() => (justShown.current = false), 300);
      }
    };

    content.addEventListener("ionScroll", handleScroll);
    tabBar.addEventListener("click", handleClick, true);

    return () => {
      content.removeEventListener("ionScroll", handleScroll);
      tabBar.removeEventListener("click", handleClick, true);
    };
  }, []);
};
