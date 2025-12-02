class Browser {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.nextTabId = 1;
        this.tabsBar = document.getElementById('tabs-bar');
        this.contentArea = document.getElementById('content-area');
        this.urlInput = document.getElementById('url-input');
        this.loadingIndicator = document.getElementById('loading-indicator');
        
        // Wisp HTTP gateways (convert wss:// to https:// for iframes)
        this.wispGateways = [
            'https://wisp.projectsegfau.lt/',  // Most reliable
            'https://wisp.voaxz.workers.dev/',  // Good backup
            'https://wisp.isthe.link/',         // Another option
            'https://wisp.ilnk.info/'           // Alternative
        ];
        this.currentGateway = 0;
        
        this.init();
    }
    
    init() {
        // Create add tab button
        const addTabBtn = document.createElement('div');
        addTabBtn.className = 'add-tab';
        addTabBtn.id = 'add-tab-btn';
        addTabBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addTabBtn.addEventListener('click', () => this.createTab());
        this.tabsBar.appendChild(addTabBtn);
        
        // Create first tab
        this.createTab();
        
        // Setup event listeners
        document.getElementById('go-btn').addEventListener('click', () => this.navigate());
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.navigate();
        });
        
        document.getElementById('back-btn').addEventListener('click', () => this.goBack());
        document.getElementById('forward-btn').addEventListener('click', () => this.goForward());
        document.getElementById('refresh-btn').addEventListener('click', () => this.refresh());
        document.getElementById('home-btn').addEventListener('click', () => this.goHome());
        
        this.setupGlobalListeners();
    }
    
    setupGlobalListeners() {
        // Handle quick link clicks
        document.addEventListener('click', (e) => {
            const quickLink = e.target.closest('.quick-link');
            if (quickLink) {
                e.preventDefault();
                const url = quickLink.getAttribute('data-url');
                const activeTab = this.getActiveTab();
                if (activeTab) {
                    this.loadUrlInTab(activeTab.id, url);
                }
            }
        });
        
        // Handle new tab page search
        document.addEventListener('keypress', (e) => {
            if (e.target.classList.contains('new-tab-input') && e.key === 'Enter') {
                const url = e.target.value.trim();
                const activeTab = this.getActiveTab();
                if (activeTab && url) {
                    this.loadUrlInTab(activeTab.id, url);
                }
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+T for new tab
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.createTab();
            }
            
            // Ctrl+L to focus address bar
            if ((e.ctrlKey && e.key === 'l') || (e.altKey && e.key === 'd')) {
                e.preventDefault();
                this.urlInput.focus();
                this.urlInput.select();
            }
        });
    }
    
    createTab(url = null) {
        const tabId = this.nextTabId++;
        const tab = {
            id: tabId,
            title: 'New Tab',
            url: url,
            element: null,
            content: null,
            history: [],
            historyIndex: -1,
            isNewTab: !url
        };
        this.tabs.push(tab);
        this.renderTab(tab);
        this.switchToTab(tabId);
        return tab;
    }
    
    renderTab(tab) {
        // Create tab element
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.setAttribute('data-tab-id', tab.id);
        tabElement.innerHTML = `
            <div class="tab-favicon"><i class="fas fa-globe"></i></div>
            <div class="tab-title">${tab.title}</div>
            <button class="tab-close"><i class="fas fa-times"></i></button>
        `;
        
        // Create content element
        const contentElement = document.createElement('div');
        contentElement.className = 'browser-frame-container';
        contentElement.id = `tab-content-${tab.id}`;
        
        if (tab.isNewTab) {
            contentElement.innerHTML = this.createNewTabPage();
        } else {
            const proxyUrl = this.getProxyUrl(tab.url);
            contentElement.innerHTML = `<iframe class="browser-frame" id="frame-${tab.id}" src="${proxyUrl}" sandbox="allow-same-origin allow-scripts allow-popups allow-forms" referrerpolicy="no-referrer"></iframe>`;
        }
        
        // Add to DOM
        this.tabsBar.insertBefore(tabElement, document.getElementById('add-tab-btn'));
        this.contentArea.appendChild(contentElement);
        
        // Add event listeners
        tabElement.addEventListener('click', (e) => {
            if (!e.target.closest('.tab-close')) {
                this.switchToTab(tab.id);
            }
        });
        
        tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });
        
        // Store references
        tab.element = tabElement;
        tab.content = contentElement;
    }
    
    createNewTabPage() {
        return `
            <div class="new-tab-page">
                <div class="new-tab-logo">/Purge</div>
                <p style="color: var(--text); margin-bottom: 2rem; font-size: 1.2rem;">Web Proxy Browser</p>
                <div class="new-tab-search">
                    <input type="text" class="new-tab-input" placeholder="Search DuckDuckGo or enter website URL">
                </div>
                <div class="quick-links">
                    <div class="quick-link" data-url="https://duckduckgo.com">
                        <i class="fas fa-search"></i>
                        <div class="quick-link-title">DuckDuckGo</div>
                        <div class="quick-link-desc">Search Engine</div>
                    </div>
                    <div class="quick-link" data-url="https://youtube.com">
                        <i class="fab fa-youtube"></i>
                        <div class="quick-link-title">YouTube</div>
                        <div class="quick-link-desc">Videos</div>
                    </div>
                    <div class="quick-link" data-url="https://github.com">
                        <i class="fab fa-github"></i>
                        <div class="quick-link-title">GitHub</div>
                        <div class="quick-link-desc">Code</div>
                    </div>
                    <div class="quick-link" data-url="https://wikipedia.org">
                        <i class="fab fa-wikipedia-w"></i>
                        <div class="quick-link-title">Wikipedia</div>
                        <div class="quick-link-desc">Encyclopedia</div>
                    </div>
                    <div class="quick-link" data-url="https://reddit.com">
                        <i class="fab fa-reddit"></i>
                        <div class="quick-link-title">Reddit</div>
                        <div class="quick-link-desc">Community</div>
                    </div>
                    <div class="quick-link" data-url="https://discord.com">
                        <i class="fab fa-discord"></i>
                        <div class="quick-link-title">Discord</div>
                        <div class="quick-link-desc">Chat</div>
                    </div>
                </div>
                <div style="margin-top: 2rem; color: var(--text); font-size: 0.9rem; background: rgba(139, 92, 246, 0.1); padding: 1rem; border-radius: 8px; max-width: 600px;">
                    <p><strong>Using Wisp Proxy:</strong> Automatic gateway rotation</p>
                    <p><strong>Search:</strong> Queries use DuckDuckGo</p>
                </div>
            </div>
        `;
    }
    
    getProxyUrl(url) {
        // Encode URL for Wisp gateway
        const encodedUrl = encodeURIComponent(url);
        
        // Use current gateway
        const gateway = this.wispGateways[this.currentGateway];
        const proxyUrl = `${gateway}${encodedUrl}`;
        
        console.log('Wisp Proxy URL:', proxyUrl);
        return proxyUrl;
    }
    
    switchToTab(tabId) {
        // Hide all tabs
        this.tabs.forEach(tab => {
            if (tab.content) tab.content.classList.remove('active');
            if (tab.element) tab.element.classList.remove('active');
        });
        
        // Show active tab
        const activeTab = this.tabs.find(tab => tab.id === tabId);
        if (activeTab) {
            if (activeTab.content) activeTab.content.classList.add('active');
            if (activeTab.element) activeTab.element.classList.add('active');
            this.activeTabId = tabId;
            
            // Update URL input
            this.urlInput.value = activeTab.url || '';
        }
        
        this.updateNavButtons();
    }
    
    closeTab(tabId) {
        if (this.tabs.length <= 1) return;
        
        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;
        
        const tab = this.tabs[tabIndex];
        
        // Remove elements
        if (tab.element) tab.element.remove();
        if (tab.content) tab.content.remove();
        
        // Remove from array
        this.tabs.splice(tabIndex, 1);
        
        // Switch to another tab
        if (this.activeTabId === tabId) {
            const newActiveTab = this.tabs[Math.max(0, tabIndex - 1)];
            if (newActiveTab) {
                this.switchToTab(newActiveTab.id);
            }
        }
    }
    
    getActiveTab() {
        return this.tabs.find(tab => tab.id === this.activeTabId);
    }
    
    navigate() {
        const url = this.urlInput.value.trim();
        const activeTab = this.getActiveTab();
        
        if (activeTab && url) {
            console.log('Navigating to:', url);
            this.loadUrlInTab(activeTab.id, url);
        }
    }
    
    loadUrlInTab(tabId, url) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (!tab || !url) return;
        
        this.showLoading();
        
        // Process URL
        let finalUrl = url.trim();
        
        // Check if it's a search query
        const isSearchQuery = url.includes(' ') || 
                             (!url.includes('.') && !url.includes('://') && !url.startsWith('http'));
        
        if (isSearchQuery) {
            // Convert to DuckDuckGo search
            const searchQuery = encodeURIComponent(url);
            finalUrl = `https://duckduckgo.com/?q=${searchQuery}&ia=web`;
            console.log('Converted to DuckDuckGo search:', finalUrl);
        } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            // Add https:// if missing
            finalUrl = 'https://' + finalUrl;
            console.log('Added https://:', finalUrl);
        }
        
        // Update tab info
        tab.url = finalUrl;
        tab.title = this.extractDomain(finalUrl);
        tab.isNewTab = false;
        
        if (tab.element) {
            tab.element.querySelector('.tab-title').textContent = tab.title;
        }
        
        // Get proxy URL
        const proxyUrl = this.getProxyUrl(finalUrl);
        console.log('Final proxy URL:', proxyUrl);
        
        // Create iframe HTML
        const iframeHtml = `<iframe class="browser-frame" id="frame-${tabId}" src="${proxyUrl}" sandbox="allow-same-origin allow-scripts allow-popups allow-forms" referrerpolicy="no-referrer"></iframe>`;
        
        // Update or create content
        if (tab.content.querySelector('.new-tab-page')) {
            tab.content.innerHTML = iframeHtml;
        } else {
            const frame = document.getElementById(`frame-${tabId}`);
            if (frame) {
                frame.src = proxyUrl;
            } else {
                tab.content.innerHTML = iframeHtml;
            }
        }
        
        // Setup iframe load/error handlers
        setTimeout(() => {
            const frame = document.getElementById(`frame-${tabId}`);
            if (frame) {
                frame.onload = () => {
                    console.log('Page loaded successfully');
                    this.hideLoading();
                };
                
                frame.onerror = () => {
                    console.error('Iframe failed to load, trying next gateway...');
                    
                    // Try next gateway
                    this.currentGateway = (this.currentGateway + 1) % this.wispGateways.length;
                    console.log('Switching to gateway:', this.wispGateways[this.currentGateway]);
                    
                    // Retry with new gateway
                    const newProxyUrl = this.getProxyUrl(finalUrl);
                    frame.src = newProxyUrl;
                    
                    // Don't hide loading - let retry happen
                };
            }
        }, 100);
        
        // Update URL input and history
        this.urlInput.value = finalUrl;
        
        // Update history
        if (tab.historyIndex === -1 || tab.history[tab.historyIndex] !== finalUrl) {
            tab.history = tab.history.slice(0, tab.historyIndex + 1);
            tab.history.push(finalUrl);
            tab.historyIndex = tab.history.length - 1;
        }
        
        this.updateNavButtons();
        
        // Auto-hide loading after timeout
        setTimeout(() => {
            console.log('Auto-hiding loading indicator');
            this.hideLoading();
        }, 10000);
    }
    
    showError(tabId, message) {
        console.log('Showing error:', message);
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (tab && tab.content) {
            tab.content.innerHTML = `
                <div class="new-tab-page">
                    <div class="new-tab-logo" style="color: #ef4444;">/Purge</div>
                    <p style="color: var(--text); margin-bottom: 1rem; font-size: 1.2rem;">Error Loading Page</p>
                    <p style="color: var(--text); margin-bottom: 2rem;">${message}</p>
                    <div style="margin-top: 1rem;">
                        <button class="go-btn" onclick="window.browser.refresh()">
                            <i class="fas fa-redo"></i> Try Again
                        </button>
                        <button class="go-btn" onclick="window.browser.goHome()" style="background: var(--background); margin-left: 0.5rem;">
                            <i class="fas fa-home"></i> Home
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            let domain = urlObj.hostname;
            
            // Remove www. prefix
            if (domain.startsWith('www.')) {
                domain = domain.substring(4);
            }
            
            // Truncate if too long
            if (domain.length > 20) {
                domain = domain.substring(0, 17) + '...';
            }
            
            return domain;
        } catch (e) {
            console.log('Error extracting domain:', e);
            if (url.includes('duckduckgo.com')) {
                return 'DuckDuckGo';
            }
            return 'Website';
        }
    }
    
    showLoading() {
        this.loadingIndicator.classList.add('loading');
    }
    
    hideLoading() {
        this.loadingIndicator.classList.remove('loading');
    }
    
    goBack() {
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.historyIndex > 0) {
            activeTab.historyIndex--;
            const url = activeTab.history[activeTab.historyIndex];
            this.loadUrlInTab(activeTab.id, url);
        }
    }
    
    goForward() {
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.historyIndex < activeTab.history.length - 1) {
            activeTab.historyIndex++;
            const url = activeTab.history[activeTab.historyIndex];
            this.loadUrlInTab(activeTab.id, url);
        }
    }
    
    refresh() {
        const activeTab = this.getActiveTab();
        if (activeTab && activeTab.url) {
            this.loadUrlInTab(activeTab.id, activeTab.url);
        }
    }
    
    goHome() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            // Clear tab
            activeTab.url = null;
            activeTab.title = 'New Tab';
            activeTab.isNewTab = true;
            
            // Update tab element
            if (activeTab.element) {
                activeTab.element.querySelector('.tab-title').textContent = 'New Tab';
            }
            
            // Show new tab page
            activeTab.content.innerHTML = this.createNewTabPage();
            
            // Clear URL input
            this.urlInput.value = '';
            
            // Clear history
            activeTab.history = [];
            activeTab.historyIndex = -1;
            
            this.updateNavButtons();
        }
    }
    
    updateNavButtons() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            const canGoBack = activeTab.historyIndex > 0;
            const canGoForward = activeTab.historyIndex < activeTab.history.length - 1;
            
            document.getElementById('back-btn').disabled = !canGoBack;
            document.getElementById('forward-btn').disabled = !canGoForward;
        }
    }
}

// Initialize browser when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing /Purge Proxy Browser...');
    window.browser = new Browser();
    console.log('Browser ready. Wisp gateways loaded:', window.browser.wispGateways.length);
});