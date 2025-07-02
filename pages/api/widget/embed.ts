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
  var SHOP_DOMAIN = '${shopDomain}'.split(',')[0]; // Fix duplicate shop parameter
  var API_BASE = '${process.env.NEXT_PUBLIC_API_BASE || 'https://bargin-hunter2.vercel.app/api'}';
  var WIDGET_BASE = '${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://bargin-hunter2.vercel.app/widget'}';

  // Widget configuration (will be loaded from API)
  var widgetConfig = null;
  var isWidgetLoaded = false;

  // Utility functions
  function createStylesheet() {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = WIDGET_BASE + '/styles.css';
    document.head.appendChild(link);
  }

  function loadWidgetConfig() {
    console.log('🎮 Bargain Hunter: Loading config for shop:', SHOP_DOMAIN);
    console.log('🎮 Bargain Hunter: API URL:', API_BASE + '/game/config/' + SHOP_DOMAIN);

    return fetch(API_BASE + '/game/config/' + SHOP_DOMAIN + '?t=' + Date.now())
      .then(function(response) {
        console.log('🎮 Bargain Hunter: Config response status:', response.status);
        return response.json();
      })
      .then(function(config) {
        console.log('🎮 Bargain Hunter: Config loaded:', config);
        // Extract widget settings from nested structure
        widgetConfig = config.widgetSettings;
        widgetConfig.gameSettings = config.gameSettings;
        widgetConfig.appearance = config.appearance;
        widgetConfig.success = config.success;
        
        console.log('🎮 Bargain Hunter: Widget config extracted:', widgetConfig);
        return config;
      })
      .catch(function(error) {
        console.error('🎮 Bargain Hunter: Failed to load config:', error);
        // Use default config
        widgetConfig = {
          displayMode: 'popup',
          triggerEvent: 'immediate',
          position: 'bottom-right',
          showOn: 'all_pages',
          userPercentage: 100,
          testMode: false,
          showDelay: 0,
          pageLoadTrigger: 'immediate',
          deviceTargeting: 'all',
          geoTargeting: [],
          timeBasedRules: { enabled: false },
          gameSettings: { isEnabled: true },
          appearance: { primaryColor: '#ff6b6b' },
          success: true
        };
        console.log('🎮 Bargain Hunter: Using default config:', widgetConfig);
        return widgetConfig;
      });
  }

  function shouldShowWidget() {
    console.log('🎮 Bargain Hunter: Checking if widget should show...');
    console.log('🎮 Bargain Hunter: Widget config:', {
      displayMode: widgetConfig && widgetConfig.displayMode,
      showOn: widgetConfig && widgetConfig.showOn,
      userPercentage: widgetConfig && widgetConfig.userPercentage,
      testMode: widgetConfig && widgetConfig.testMode,
      isEnabled: widgetConfig && widgetConfig.gameSettings && widgetConfig.gameSettings.isEnabled
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
      var isTestEnvironment = window.location.search.indexOf('test=true') !== -1 || 
                              window.location.hostname === 'localhost' ||
                              window.location.hostname.indexOf('vercel.app') !== -1;
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
    var shouldShow = checkPageTargeting();
    console.log('🎮 Bargain Hunter: Final result - should show:', shouldShow);
    return shouldShow;
  }

  function checkUserPercentage() {
    var userPercentage = widgetConfig.userPercentage || 100;
    if (userPercentage >= 100) return true;
    
    // Simple hash-based percentage check using shop domain and current date
    var seed = SHOP_DOMAIN + new Date().toDateString();
    var hash = 0;
    for (var i = 0; i < seed.length; i++) {
      var char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    var percentage = Math.abs(hash) % 100;
    return percentage < userPercentage;
  }

  function checkDeviceTargeting() {
    var deviceTargeting = widgetConfig.deviceTargeting || 'all';
    if (deviceTargeting === 'all') return true;
    
    var isMobile = window.innerWidth < 768 || 
                   (window.screen && window.screen.width <= 768) ||
                   /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768 && window.innerWidth < 1024;
    
    switch (deviceTargeting) {
      case 'mobile':
        return isMobile && !isTablet;
      case 'tablet':
        return isTablet;
      case 'desktop':
        return !isMobile && !isTablet;
      default:
        return true;
    }
  }

  function checkTimeBasedRules() {
    var timeRules = widgetConfig.timeBasedRules;
    if (!timeRules || !timeRules.enabled) return true;
    
    var now = new Date();
    var currentHour = now.getHours();
    var currentMinute = now.getMinutes();
    var currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Check days of week
    if (timeRules.daysOfWeek && timeRules.daysOfWeek.length > 0) {
      if (timeRules.daysOfWeek.indexOf(currentDay) === -1) {
        return false;
      }
    }

    // Check time range
    if (timeRules.startTime && timeRules.endTime) {
      var startParts = timeRules.startTime.split(':');
      var endParts = timeRules.endTime.split(':');
      var startHour = parseInt(startParts[0]);
      var startMinute = parseInt(startParts[1] || '0');
      var endHour = parseInt(endParts[0]);
      var endMinute = parseInt(endParts[1] || '0');
      
      var currentTimeMinutes = currentHour * 60 + currentMinute;
      var startTimeMinutes = startHour * 60 + startMinute;
      var endTimeMinutes = endHour * 60 + endMinute;
      
      if (startTimeMinutes <= endTimeMinutes) {
        // Same day range
        if (currentTimeMinutes < startTimeMinutes || currentTimeMinutes > endTimeMinutes) {
          return false;
        }
      } else {
        // Overnight range
        if (currentTimeMinutes < startTimeMinutes && currentTimeMinutes > endTimeMinutes) {
          return false;
        }
      }
    }

    return true;
  }

  function checkPageTargeting() {
    var currentPath = window.location.pathname;
    var currentUrl = window.location.href;
    console.log('🎮 Bargain Hunter: Checking page targeting for path:', currentPath, 'URL:', currentUrl, 'showOn:', widgetConfig.showOn);

    switch (widgetConfig.showOn) {
      case 'homepage':
        var isHomepage = currentPath === '/' || currentPath === '';
        console.log('🎮 Bargain Hunter: Homepage check:', isHomepage);
        return isHomepage;
      case 'product_pages':
        return currentPath.indexOf('/products/') !== -1;
      case 'collection_pages':
        return currentPath.indexOf('/collections/') !== -1;
      case 'cart_page':
        return currentPath.indexOf('/cart') !== -1;
      case 'checkout_page':
        return currentPath.indexOf('/checkout') !== -1;
      case 'custom':
        return widgetConfig.customPages &&
               widgetConfig.customPages.some(function(page) { return currentPath.indexOf(page) !== -1; });
      case 'all_pages':
      default:
        console.log('🎮 Bargain Hunter: Showing on all pages');
        return true;
    }
  }

  function createWidgetContainer() {
    var container = document.createElement('div');
    container.id = 'bargain-hunter-widget';
    container.style.cssText = 
      'position: fixed;' +
      'z-index: 999999;' +
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
    
    document.body.appendChild(container);
    return container;
  }

  function createTabWidget(container) {
    var tab = document.createElement('div');
    tab.className = 'bargain-hunter-tab';
    tab.innerHTML = '🎮 Play for Discount!';
    
    // Position the tab
    var position = widgetConfig.position || 'bottom-right';
    switch (position) {
      case 'bottom-right':
        tab.style.cssText = 
          'position: fixed;' +
          'bottom: 0;' +
          'right: 20px;' +
          'background: linear-gradient(45deg, #ff6b6b, #4ecdc4);' +
          'color: white;' +
          'padding: 12px 20px;' +
          'border-radius: 8px 8px 0 0;' +
          'cursor: pointer;' +
          'font-weight: bold;' +
          'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);' +
          'transition: all 0.3s ease;' +
          'font-size: 14px;' +
          'z-index: 999999;';
        break;
      case 'bottom-left':
        tab.style.cssText = 
          'position: fixed;' +
          'bottom: 0;' +
          'left: 20px;' +
          'background: linear-gradient(45deg, #ff6b6b, #4ecdc4);' +
          'color: white;' +
          'padding: 12px 20px;' +
          'border-radius: 8px 8px 0 0;' +
          'cursor: pointer;' +
          'font-weight: bold;' +
          'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);' +
          'transition: all 0.3s ease;' +
          'font-size: 14px;' +
          'z-index: 999999;';
        break;
    }

    tab.addEventListener('click', openGameModal);
    container.appendChild(tab);
  }

  function createFloatingButtonWidget(container) {
    var floatingConfig = widgetConfig.floatingButton || {
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

    var button = document.createElement('button');
    button.innerHTML =
      '<span style="font-size: 1.2em;">' + floatingConfig.icon + '</span>' +
      '<span>' + floatingConfig.text + '</span>';

    // Detect if mobile
    var isMobile = window.innerWidth < 768 ||
                   (window.screen && window.screen.width <= 768) ||
                   /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    var position = isMobile ? floatingConfig.position.mobile : floatingConfig.position.desktop;
    var offset = isMobile ? floatingConfig.offset.mobile : floatingConfig.offset.desktop;

    // Base styles
    button.style.cssText =
      'position: fixed;' +
      'z-index: 999999;' +
      'cursor: pointer;' +
      'border: none;' +
      'outline: none;' +
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;' +
      'font-weight: 600;' +
      'display: flex;' +
      'align-items: center;' +
      'gap: 8px;' +
      'transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);' +
      'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);' +
      'backdrop-filter: blur(10px);' +
      'user-select: none;' +
      '-webkit-user-select: none;' +
      '-webkit-tap-highlight-color: transparent;' +
      'background: ' + floatingConfig.backgroundColor + ';' +
      'color: ' + floatingConfig.textColor + ';' +
      'border-radius: ' + floatingConfig.borderRadius + 'px;';

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
      var animationCSS = '';
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
      var style = document.createElement('style');
      style.id = 'bargain-hunter-animations';
      style.textContent =
        '@keyframes pulse {' +
          '0%, 100% { transform: scale(1); }' +
          '50% { transform: scale(1.05); }' +
        '}' +
        '@keyframes bounce {' +
          '0%, 20%, 50%, 80%, 100% { transform: translateY(0); }' +
          '40% { transform: translateY(-10px); }' +
          '60% { transform: translateY(-5px); }' +
        '}' +
        '@keyframes shake {' +
          '0%, 100% { transform: translateX(0); }' +
          '10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }' +
          '20%, 40%, 60%, 80% { transform: translateX(3px); }' +
        '}';
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
          var scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
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
    var overlay = document.createElement('div');
    overlay.id = 'bargain-hunter-modal';
    overlay.style.cssText =
      'position: fixed;' +
      'top: 0;' +
      'left: 0;' +
      'width: 100%;' +
      'height: 100%;' +
      'background: rgba(0, 0, 0, 0.5);' +
      'z-index: 999998;' +
      'display: flex;' +
      'align-items: center;' +
      'justify-content: center;';

    // Create modal content
    var modal = document.createElement('div');
    modal.style.cssText =
      'background: white;' +
      'border-radius: 12px;' +
      'box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);' +
      'position: relative;' +
      'display: flex;' +
      'flex-direction: column;' +
      'align-items: center;' +
      'justify-content: center;' +
      'padding: 0;' +
      'overflow: hidden;';

    // Create iframe for the game
    var iframe = document.createElement('iframe');
    iframe.src = API_BASE.replace('/api', '') + '/widget/game?shop=' + encodeURIComponent(SHOP_DOMAIN);
    iframe.style.cssText =
      'width: 100%;' +
      'height: auto;' +
      'min-width: 300px;' +
      'min-height: 400px;' +
      'max-width: 600px;' +
      'max-height: 90vh;' +
      'border: none;' +
      'display: block;' +
      'border-radius: 12px;';

    // Standardized sizing for consistent game experience with reliable mobile detection
    var isMobile = window.innerWidth < 768 ||
                   (window.screen && window.screen.width <= 768) ||
                   /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
      iframe.style.width = '370px';
      iframe.style.height = '600px';
    } else {
      iframe.style.width = '540px';
      iframe.style.height = '700px';
    }

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText =
      'position: absolute;' +
      'top: 10px;' +
      'right: 10px;' +
      'background: none;' +
      'border: none;' +
      'font-size: 24px;' +
      'cursor: pointer;' +
      'color: #666;' +
      'z-index: 1;' +
      'width: 30px;' +
      'height: 30px;' +
      'border-radius: 50%;' +
      'display: flex;' +
      'align-items: center;' +
      'justify-content: center;';

    closeBtn.addEventListener('click', function() {
      document.body.removeChild(overlay);
    });

    closeBtn.addEventListener('mouseenter', function() {
      this.style.background = 'rgba(0, 0, 0, 0.1)';
    });

    closeBtn.addEventListener('mouseleave', function() {
      this.style.background = 'none';
    });

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    });

    // Handle iframe messages for resizing
    window.addEventListener('message', function(event) {
      if (event.origin !== API_BASE.replace('/api', '')) return;

      if (event.data.type === 'resize') {
        // Handle iframe resize with standardized game sizes
        var iframe = document.querySelector('#bargain-hunter-modal iframe');
        if (iframe && event.data.height) {
          // More reliable mobile detection for iframe context
          var isMobile = window.innerWidth < 768 ||
                         (window.screen && window.screen.width <= 768) ||
                         /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

          // Use standardized sizes for consistent experience
          var newWidth = isMobile ? 370 : 540; // Matches initial sizing
          var newHeight = event.data.height;

          iframe.style.width = newWidth + 'px';
          iframe.style.height = newHeight + 'px';
        }
      }
    });

    modal.appendChild(iframe);
    modal.appendChild(closeBtn);
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
      var showDelay = widgetConfig.showDelay || 0;
      var pageLoadTrigger = widgetConfig.pageLoadTrigger || 'immediate';

      console.log('🎮 Bargain Hunter: Show delay:', showDelay, 'Page load trigger:', pageLoadTrigger);

      function showWidget() {
        console.log('🎮 Bargain Hunter: Creating widget with display mode:', widgetConfig.displayMode);
        var container = createWidgetContainer();

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

        console.log('🎮 Bargain Hunter: Widget created successfully');
      }

      // Handle different page load triggers
      switch (pageLoadTrigger) {
        case 'immediate':
          setTimeout(showWidget, showDelay * 1000);
          break;

        case 'after_delay':
          setTimeout(showWidget, (showDelay + 2) * 1000);
          break;

        case 'on_scroll':
          var scrollTriggered = false;
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
          var exitTriggered = false;
          function handleExitIntent(e) {
            if (!exitTriggered && e.clientY <= 0) {
              exitTriggered = true;
              setTimeout(showWidget, showDelay * 1000);
              document.removeEventListener('mouseleave', handleExitIntent);
            }
          }
          document.addEventListener('mouseleave', handleExitIntent);
          break;

        default:
          setTimeout(showWidget, showDelay * 1000);
      }
    }).catch(function(error) {
      console.error('🎮 Bargain Hunter: Failed to initialize widget:', error);
    });
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

})();
`;

  res.status(200).end(embedScript);
}
