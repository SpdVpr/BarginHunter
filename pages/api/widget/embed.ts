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
  
  // Prevent multiple initializations
  if (window.BargainHunterInitialized) {
    return;
  }
  window.BargainHunterInitialized = true;

  // Configuration
  const SHOP_DOMAIN = '${shopDomain}';
  const API_BASE = '${process.env.NEXT_PUBLIC_API_BASE || 'https://bargain-hunter.vercel.app/api'}';
  const WIDGET_BASE = '${process.env.NEXT_PUBLIC_WIDGET_URL || 'https://bargain-hunter.vercel.app/widget'}';

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
    return fetch(API_BASE + '/game/config/' + SHOP_DOMAIN)
      .then(response => response.json())
      .then(config => {
        widgetConfig = config;
        return config;
      })
      .catch(error => {
        console.error('Failed to load Bargain Hunter config:', error);
        // Use default config
        widgetConfig = {
          displayMode: 'tab',
          triggerEvent: 'immediate',
          position: 'bottom-right',
          showOn: 'all_pages'
        };
        return widgetConfig;
      });
  }

  function shouldShowWidget() {
    if (!widgetConfig) return false;
    
    const currentPath = window.location.pathname;
    
    switch (widgetConfig.showOn) {
      case 'product_pages':
        return currentPath.includes('/products/');
      case 'collection_pages':
        return currentPath.includes('/collections/');
      case 'custom':
        return widgetConfig.customPages && 
               widgetConfig.customPages.some(page => currentPath.includes(page));
      case 'all_pages':
      default:
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
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      position: relative;
    \`;

    // Create iframe for the game
    const iframe = document.createElement('iframe');
    iframe.src = WIDGET_BASE + '/game?shop=' + encodeURIComponent(SHOP_DOMAIN);
    iframe.style.cssText = \`
      width: 600px;
      height: 500px;
      border: none;
      display: block;
    \`;

    // Make responsive
    if (window.innerWidth < 768) {
      iframe.style.width = '95vw';
      iframe.style.height = '70vh';
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
      }
    });

    modal.appendChild(closeBtn);
    modal.appendChild(iframe);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // Initialize widget
  function initWidget() {
    loadWidgetConfig().then(function() {
      if (!shouldShowWidget()) {
        return;
      }

      const container = createWidgetContainer();
      
      switch (widgetConfig.displayMode) {
        case 'tab':
          createTabWidget(container);
          break;
        case 'popup':
          createPopupWidget(container);
          break;
        case 'inline':
          // Inline mode would need to be handled differently
          // as it requires a specific container element
          console.log('Inline mode not implemented in embed script');
          break;
      }
      
      isWidgetLoaded = true;
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
