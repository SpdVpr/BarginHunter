import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set appropriate headers for JavaScript file
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  
  // Get shop domain from query parameters
  const shopDomain = req.query.shop as string;
  
  if (!shopDomain) {
    res.status(400).end('// Error: Shop domain is required');
    return;
  }

  // Generate the embed script
  const embedScript = `
(function() {
  'use strict';

  console.log('🎮 Bargain Hunter: Embed script starting...');

  // Prevent multiple initializations
  if (window.BargainHunterInitialized) {
    console.log('🎮 Bargain Hunter: Already initialized, skipping...');
    return;
  }
  window.BargainHunterInitialized = true;
  console.log('🎮 Bargain Hunter: Initialization started');

  // Configuration
  const SHOP_DOMAIN = '${shopDomain}'.split(',')[0]; // Fix duplicate shop parameter
  const API_BASE = '${process.env.NEXT_PUBLIC_API_BASE || 'https://bargin-hunter2.vercel.app/api'}';
  const WIDGET_BASE = '${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://bargin-hunter2.vercel.app/widget'}';

  // Widget configuration (will be loaded from API)
  let widgetConfig = null;
  let isWidgetLoaded = false;

  // Utility functions
  function createStylesheet() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = WIDGET_BASE + '/styles.css';
    document.head.appendChild(link);
  }

  function loadWidgetConfig() {
    console.log('🎮 Bargain Hunter: Loading config for shop:', SHOP_DOMAIN);
    console.log('🎮 Bargain Hunter: API URL:', API_BASE + '/game/config/' + SHOP_DOMAIN);

    return fetch(API_BASE + '/game/config/' + SHOP_DOMAIN + '?t=' + Date.now())
      .then(response => {
        console.log('🎮 Bargain Hunter: Config response status:', response.status);
        return response.json();
      })
      .then(config => {
        console.log('🎮 Bargain Hunter: Config loaded:', config);
        // Extract widget settings from nested structure
        widgetConfig = {
          ...config.widgetSettings,
          gameSettings: config.gameSettings,
          appearance: config.appearance,
          success: config.success
        };
        console.log('🎮 Bargain Hunter: Widget config extracted:', widgetConfig);
        return config;
      })
      .catch(error => {
        console.error('🎮 Bargain Hunter: Failed to load config:', error);
        // Use default config
        widgetConfig = {
          displayMode: 'popup',
          triggerEvent: 'immediate',
          position: 'bottom-right',
          showOn: 'all_pages',
          userPercentage: 100,
          testMode: true,
          showDelay: 0,
          pageLoadTrigger: 'immediate'
        };
        console.log('🎮 Bargain Hunter: Using default config:', widgetConfig);
        return widgetConfig;
      });
  }

  function shouldShowWidget() {
    console.log('🎮 Bargain Hunter: Checking if widget should show...');
    console.log('🎮 Bargain Hunter: Widget config:', {
      displayMode: widgetConfig?.displayMode,
      showOn: widgetConfig?.showOn,
      userPercentage: widgetConfig?.userPercentage,
      testMode: widgetConfig?.testMode,
      targetUrls: widgetConfig?.targetUrls,
      customPages: widgetConfig?.customPages,
      isEnabled: widgetConfig?.gameSettings?.isEnabled
    });

    if (!widgetConfig) {
      console.log('🎮 Bargain Hunter: No widget config - not showing');
      return false;
    }

    // Check if game is enabled
    if (widgetConfig.gameSettings && widgetConfig.gameSettings.isEnabled === false) {
      console.log('🎮 Bargain Hunter: Game is disabled - not showing');
      return false;
    }

    // Check if test mode is enabled - if so, only show to admin (skip for now, implement admin detection later)
    if (widgetConfig.testMode === true) {
      console.log('🎮 Bargain Hunter: Test mode enabled - widget only visible to admin');
      // For now, when test mode is enabled, don't show to anyone except in test environment
      const isTestEnvironment = window.location.search.includes('test=true') ||
                                window.location.hostname === 'localhost' ||
                                window.location.hostname.includes('vercel.app');
      if (!isTestEnvironment) {
        console.log('🎮 Bargain Hunter: Not in test environment, hiding widget');
        return false;
      }
    }

    // Check user percentage targeting
    if (!checkUserPercentage()) {
      console.log('🎮 Bargain Hunter: User percentage check failed');
      return false;
    }

    // Check device targeting
    if (!checkDeviceTargeting()) {
      console.log('🎮 Bargain Hunter: Device targeting check failed');
      return false;
    }

    // Check time-based rules
    if (!checkTimeBasedRules()) {
      console.log('🎮 Bargain Hunter: Time-based rules check failed');
      return false;
    }

    // Check page targeting
    const shouldShow = checkPageTargeting();
    console.log('🎮 Bargain Hunter: Final result - should show:', shouldShow);
    return shouldShow;
  }

  function checkUserPercentage() {
    const percentage = widgetConfig.userPercentage || 100;
    console.log('🎮 Bargain Hunter: Checking user percentage:', percentage + '%');

    if (percentage >= 100) {
      console.log('🎮 Bargain Hunter: 100% targeting - showing to all users');
      return true;
    }

    // Use a simple random check for each page load
    // This ensures the percentage is actually respected
    const randomValue = Math.random() * 100;
    const shouldShow = randomValue < percentage;

    console.log('🎮 Bargain Hunter: Random value:', randomValue.toFixed(2), 'Target percentage:', percentage, 'Should show:', shouldShow);
    return shouldShow;
  }

  function checkDeviceTargeting() {
    const deviceTarget = widgetConfig.deviceTargeting || 'all';
    if (deviceTarget === 'all') return true;

    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent) && !/mobile/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    switch (deviceTarget) {
      case 'mobile':
        return isMobile && !isTablet;
      case 'tablet':
        return isTablet;
      case 'desktop':
        return isDesktop;
      default:
        return true;
    }
  }

  function checkTimeBasedRules() {
    const timeRules = widgetConfig.timeBasedRules;
    if (!timeRules || !timeRules.enabled) return true;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Check days of week
    if (timeRules.daysOfWeek && timeRules.daysOfWeek.length > 0) {
      if (!timeRules.daysOfWeek.includes(currentDay)) {
        return false;
      }
    }

    // Check time range
    if (timeRules.startTime && timeRules.endTime) {
      const [startHour, startMinute] = timeRules.startTime.split(':').map(Number);
      const [endHour, endMinute] = timeRules.endTime.split(':').map(Number);

      const currentTimeMinutes = currentHour * 60 + currentMinute;
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;

      if (startTimeMinutes <= endTimeMinutes) {
        // Same day range
        if (currentTimeMinutes < startTimeMinutes || currentTimeMinutes > endTimeMinutes) {
          return false;
        }
      } else {
        // Overnight range (e.g., 22:00 to 06:00)
        if (currentTimeMinutes < startTimeMinutes && currentTimeMinutes > endTimeMinutes) {
          return false;
        }
      }
    }

    return true;
  }

  function checkPageTargeting() {
    const currentPath = window.location.pathname;
    const currentUrl = window.location.href;
    console.log('🎮 Bargain Hunter: Checking page targeting for path:', currentPath, 'URL:', currentUrl, 'showOn:', widgetConfig.showOn);

    switch (widgetConfig.showOn) {
      case 'homepage':
        const isHomepage = currentPath === '/' || currentPath === '';
        console.log('🎮 Bargain Hunter: Homepage check:', isHomepage);
        return isHomepage;
      case 'product_pages':
        return currentPath.includes('/products/');
      case 'collection_pages':
        return currentPath.includes('/collections/');
      case 'cart_page':
        return currentPath.includes('/cart');
      case 'checkout_page':
        return currentPath.includes('/checkout');
      case 'custom':
        return widgetConfig.customPages &&
               widgetConfig.customPages.some(page => currentPath.includes(page));
      case 'url_targeting':
        // Check if current URL matches any of the target URLs
        if (widgetConfig.targetUrls && widgetConfig.targetUrls.length > 0) {
          console.log('🎮 Bargain Hunter: URL targeting enabled with URLs:', widgetConfig.targetUrls);
          const matches = widgetConfig.targetUrls.some(targetUrl => {
            if (!targetUrl || targetUrl.trim() === '') {
              console.log('🎮 Bargain Hunter: Empty target URL, skipping');
              return false;
            }

            // Normalize URLs for comparison
            const normalizedTarget = targetUrl.toLowerCase().trim();
            const normalizedCurrent = currentUrl.toLowerCase();
            const normalizedCurrentPath = currentPath.toLowerCase();

            console.log('🎮 Bargain Hunter: Comparing URLs:', {
              target: normalizedTarget,
              currentUrl: normalizedCurrent,
              currentPath: normalizedCurrentPath
            });

            // Multiple matching strategies:
            // 1. Exact URL match (remove trailing slashes for comparison)
            const cleanTarget = normalizedTarget.replace(/\/$/, '');
            const cleanCurrent = normalizedCurrent.replace(/\/$/, '');
            if (cleanCurrent === cleanTarget) {
              console.log('🎮 Bargain Hunter: Exact URL match found');
              return true;
            }

            // 2. URL starts with target (for query params and trailing content)
            if (normalizedCurrent.startsWith(normalizedTarget)) {
              console.log('🎮 Bargain Hunter: URL starts with target');
              return true;
            }

            // 3. Path-only matching (if target is just a path)
            if (normalizedTarget.startsWith('/') && !normalizedTarget.includes('://')) {
              const cleanTargetPath = normalizedTarget.replace(/\/$/, '');
              const cleanCurrentPath = normalizedCurrentPath.replace(/\/$/, '');

              if (cleanCurrentPath === cleanTargetPath) {
                console.log('🎮 Bargain Hunter: Exact path match found');
                return true;
              }

              if (normalizedCurrentPath.startsWith(normalizedTarget)) {
                console.log('🎮 Bargain Hunter: Path starts with target');
                return true;
              }
            }

            // 4. Domain + path matching for full URLs
            if (normalizedTarget.includes('://')) {
              try {
                const targetUrlObj = new URL(normalizedTarget);
                const currentUrlObj = new URL(normalizedCurrent);

                // Check if domain matches and path matches
                if (targetUrlObj.hostname === currentUrlObj.hostname) {
                  const targetPath = targetUrlObj.pathname.replace(/\/$/, '');
                  const currentPath = currentUrlObj.pathname.replace(/\/$/, '');

                  if (currentPath === targetPath || currentPath.startsWith(targetPath + '/')) {
                    console.log('🎮 Bargain Hunter: Domain and path match found');
                    return true;
                  }
                }
              } catch (urlError) {
                console.log('🎮 Bargain Hunter: URL parsing error:', urlError);
              }
            }

            return false;
          });
          console.log('🎮 Bargain Hunter: URL targeting final result:', matches, 'Target URLs:', widgetConfig.targetUrls);
          return matches;
        }
        console.log('🎮 Bargain Hunter: No target URLs configured for URL targeting');
        return false;
      case 'all_pages':
      default:
        console.log('🎮 Bargain Hunter: Showing on all pages');
        return true;
    }
  }

  function createWidgetContainer() {
    const container = document.createElement('div');
    container.id = 'bargain-hunter-widget-container';
    container.style.cssText = \`
      position: fixed;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    \`;
    
    document.body.appendChild(container);
    return container;
  }

  function createTabWidget(container) {
    const tab = document.createElement('div');
    tab.className = 'bargain-hunter-tab';
    tab.innerHTML = '🎮 Play for Discount!';
    
    // Position the tab
    const position = widgetConfig.position || 'bottom-right';
    switch (position) {
      case 'bottom-right':
        tab.style.cssText = \`
          position: fixed;
          bottom: 0;
          right: 20px;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          color: white;
          padding: 12px 20px;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          font-size: 14px;
          z-index: 999999;
        \`;
        break;
      case 'bottom-left':
        tab.style.cssText = \`
          position: fixed;
          bottom: 0;
          left: 20px;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          color: white;
          padding: 12px 20px;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          font-size: 14px;
          z-index: 999999;
        \`;
        break;
      // Add more positions as needed
    }
    
    tab.addEventListener('click', openGameModal);
    tab.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
    });
    tab.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    });
    
    container.appendChild(tab);
  }

  function createFloatingButtonWidget(container) {
    const floatingConfig = widgetConfig.floatingButton || {
      text: 'Play Game',
      icon: '🎮',
      backgroundColor: '#ff6b6b',
      textColor: '#ffffff',
      borderRadius: 25,
      size: 'medium',
      position: {
        desktop: 'bottom-right',
        mobile: 'bottom-right'
      },
      offset: {
        desktop: { x: 20, y: 20 },
        mobile: { x: 15, y: 15 }
      },
      animation: 'pulse',
      showOnHover: false
    };

    const button = document.createElement('button');
    button.innerHTML = \`
      <span style="font-size: 1.2em;">\${floatingConfig.icon}</span>
      <span>\${floatingConfig.text}</span>
    \`;

    // Detect if mobile
    const isMobile = window.innerWidth < 768 ||
                     window.screen?.width <= 768 ||
                     /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const position = isMobile ? floatingConfig.position.mobile : floatingConfig.position.desktop;
    const offset = isMobile ? floatingConfig.offset.mobile : floatingConfig.offset.desktop;

    // Base styles
    button.style.cssText = \`
      position: fixed;
      z-index: 999999;
      cursor: pointer;
      border: none;
      outline: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
      background: \${floatingConfig.backgroundColor};
      color: \${floatingConfig.textColor};
      border-radius: \${floatingConfig.borderRadius}px;
    \`;

    // Size-specific styles
    switch (floatingConfig.size) {
      case 'small':
        button.style.padding = isMobile ? '10px 16px' : '8px 16px';
        button.style.fontSize = '14px';
        break;
      case 'large':
        button.style.padding = isMobile ? '14px 20px' : '16px 24px';
        button.style.fontSize = isMobile ? '16px' : '18px';
        break;
      default: // medium
        button.style.padding = isMobile ? '12px 18px' : '12px 20px';
        button.style.fontSize = isMobile ? '15px' : '16px';
    }

    // Position styles
    switch (position) {
      case 'top-left':
        button.style.top = offset.y + 'px';
        button.style.left = offset.x + 'px';
        break;
      case 'top-right':
        button.style.top = offset.y + 'px';
        button.style.right = offset.x + 'px';
        break;
      case 'bottom-left':
        button.style.bottom = offset.y + 'px';
        button.style.left = offset.x + 'px';
        break;
      default: // bottom-right
        button.style.bottom = offset.y + 'px';
        button.style.right = offset.x + 'px';
    }

    // Animation styles
    if (floatingConfig.animation && floatingConfig.animation !== 'none') {
      let animationCSS = '';
      switch (floatingConfig.animation) {
        case 'pulse':
          animationCSS = 'pulse 2s infinite';
          break;
        case 'bounce':
          animationCSS = 'bounce 2s infinite';
          break;
        case 'shake':
          animationCSS = 'shake 0.5s infinite';
          break;
      }
      button.style.animation = animationCSS;
    }

    // Add hover effects
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
    });

    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    });

    button.addEventListener('mousedown', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
    });

    button.addEventListener('mouseup', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
    });

    // Click handler
    button.addEventListener('click', openGameModal);

    // Add keyframe animations to document if not already added
    if (!document.getElementById('bargain-hunter-animations')) {
      const style = document.createElement('style');
      style.id = 'bargain-hunter-animations';
      style.textContent = \`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80% { transform: translateX(3px); }
        }
      \`;
      document.head.appendChild(style);
    }

    container.appendChild(button);
  }

  function createPopupWidget(container) {
    // Create trigger based on configuration
    switch (widgetConfig.triggerEvent) {
      case 'immediate':
        setTimeout(openGameModal, 1000);
        break;
      case 'time_delay':
        setTimeout(openGameModal, (widgetConfig.triggerDelay || 5) * 1000);
        break;
      case 'exit_intent':
        document.addEventListener('mouseleave', function(e) {
          if (e.clientY <= 0) {
            openGameModal();
          }
        });
        break;
      case 'scroll':
        window.addEventListener('scroll', function() {
          const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPercent > 50) {
            openGameModal();
            window.removeEventListener('scroll', arguments.callee);
          }
        });
        break;
    }
  }

  function openGameModal() {
    // Prevent multiple modals
    if (document.getElementById('bargain-hunter-modal')) {
      return;
    }

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'bargain-hunter-modal';
    overlay.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
    \`;

    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = \`
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0;
      overflow: hidden;
    \`;

    // Create iframe for the game
    const iframe = document.createElement('iframe');
    iframe.src = API_BASE.replace('/api', '') + '/widget/game?shop=' + encodeURIComponent(SHOP_DOMAIN);
    iframe.style.cssText = \`
      width: 100%;
      height: auto;
      min-width: 300px;
      min-height: 400px;
      max-width: 600px;
      max-height: 90vh;
      border: none;
      display: block;
      border-radius: 12px;
    \`;

    // Standardized sizing for consistent game experience with reliable mobile detection
    const isMobile = window.innerWidth < 768 ||
                     window.screen?.width <= 768 ||
                     /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      // Mobile: optimized for mobile games
      iframe.style.width = '370px'; // 350px game + 20px padding
      iframe.style.height = '600px'; // 500px game + 100px UI
    } else {
      // Desktop: optimized for desktop games
      iframe.style.width = '540px'; // 500px game + 40px padding
      iframe.style.height = '720px'; // 600px game + 120px UI
    }

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = \`
      position: absolute;
      top: 10px;
      right: 10px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      z-index: 1;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    \`;

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeModal();
      }
    });

    function closeModal() {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }

    // Listen for messages from iframe
    window.addEventListener('message', function(event) {
      if (event.origin !== WIDGET_BASE.replace('/widget', '')) return;

      if (event.data.type === 'BARGAIN_HUNTER_CLOSE') {
        closeModal();
      } else if (event.data.type === 'BARGAIN_HUNTER_DISCOUNT_EARNED') {
        // Handle discount earned
        console.log('Discount earned:', event.data.discount);
        // You can trigger custom events here for the merchant's theme
        window.dispatchEvent(new CustomEvent('bargainHunterDiscountEarned', {
          detail: event.data.discount
        }));
      } else if (event.data.type === 'IFRAME_RESIZE') {
        // Handle iframe resize with standardized game sizes
        const iframe = document.querySelector('#bargain-hunter-modal iframe');
        if (iframe && event.data.height) {
          // More reliable mobile detection for iframe context
          const isMobile = window.innerWidth < 768 ||
                           window.screen?.width <= 768 ||
                           /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

          // Use standardized sizes for consistent experience
          const newWidth = isMobile ? 370 : 540; // Matches initial sizing
          const newHeight = event.data.height;

          // Update iframe size with standardized dimensions
          iframe.style.height = newHeight + 'px';
          iframe.style.width = newWidth + 'px';

          // Ensure iframe fits on screen
          iframe.style.maxHeight = (window.innerHeight * 0.9) + 'px';
          iframe.style.maxWidth = (window.innerWidth * 0.95) + 'px';

          // Remove fixed aspect ratio for responsive content
          iframe.style.aspectRatio = 'unset';

          console.log('🔄 Iframe resized to:', newWidth + 'x' + newHeight);
        }
      }
    });

    modal.appendChild(closeBtn);
    modal.appendChild(iframe);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // Initialize widget
  function initWidget() {
    console.log('🎮 Bargain Hunter: Initializing widget...');

    loadWidgetConfig().then(function() {
      console.log('🎮 Bargain Hunter: Config loaded, checking if should show...');

      if (!shouldShowWidget()) {
        console.log('🎮 Bargain Hunter: Widget should not show - stopping initialization');
        return;
      }

      console.log('🎮 Bargain Hunter: Widget should show - proceeding with initialization');
      const showDelay = widgetConfig.showDelay || 0;
      const pageLoadTrigger = widgetConfig.pageLoadTrigger || 'immediate';

      console.log('🎮 Bargain Hunter: Show delay:', showDelay, 'Page load trigger:', pageLoadTrigger);

      function showWidget() {
        console.log('🎮 Bargain Hunter: Creating widget with display mode:', widgetConfig.displayMode);
        const container = createWidgetContainer();

        switch (widgetConfig.displayMode) {
          case 'tab':
            console.log('🎮 Bargain Hunter: Creating tab widget');
            createTabWidget(container);
            break;
          case 'popup':
            console.log('🎮 Bargain Hunter: Creating popup widget');
            createPopupWidget(container);
            break;
          case 'floating_button':
            console.log('🎮 Bargain Hunter: Creating floating button widget');
            createFloatingButtonWidget(container);
            break;
          case 'inline':
            // Inline mode would need to be handled differently
            // as it requires a specific container element
            console.log('🎮 Bargain Hunter: Inline mode not implemented in embed script');
            break;
        }

        isWidgetLoaded = true;
        console.log('🎮 Bargain Hunter: Widget loaded successfully!');
      }

      // Handle different trigger types
      switch (pageLoadTrigger) {
        case 'immediate':
          if (showDelay > 0) {
            setTimeout(showWidget, showDelay * 1000);
          } else {
            showWidget();
          }
          break;

        case 'after_delay':
          setTimeout(showWidget, showDelay * 1000);
          break;

        case 'on_scroll':
          let scrollTriggered = false;
          function handleScroll() {
            if (!scrollTriggered && window.scrollY > 100) {
              scrollTriggered = true;
              setTimeout(showWidget, showDelay * 1000);
              window.removeEventListener('scroll', handleScroll);
            }
          }
          window.addEventListener('scroll', handleScroll);
          break;

        case 'on_exit_intent':
          let exitTriggered = false;
          function handleMouseLeave(e) {
            if (!exitTriggered && e.clientY <= 0) {
              exitTriggered = true;
              setTimeout(showWidget, showDelay * 1000);
              document.removeEventListener('mouseleave', handleMouseLeave);
            }
          }
          document.addEventListener('mouseleave', handleMouseLeave);
          break;

        default:
          showWidget();
      }
    });
  }

  // Public API
  window.BargainHunter = {
    init: initWidget,
    openGame: openGameModal,
    isLoaded: function() { return isWidgetLoaded; },
    config: function() { return widgetConfig; }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

})();
`;

  res.status(200).send(embedScript);
}
