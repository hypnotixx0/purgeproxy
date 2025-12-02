class Browser {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.nextTabId = 1;
        this.tabsBar = document.getElementById('tabs-bar');
        this.contentArea = document.getElementById('content-area');
        this.urlInput = document.getElementById('url-input');
        this.loadingIndicator = document.getElementById('loading-indicator');
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
            contentElement.innerHTML = `<iframe class="browser-frame" id="frame-${tab.id}" src="${proxyUrl}" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>`;
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
                <div style="margin-top: 2rem; color: var(--text); font-size: 0.9rem;">
                    <p>Type any URL or search query</p>
                    <p>Search queries automatically use DuckDuckGo</p>
                </div>
            </div>
        `;
    }
    
    getProxyUrl(url) {
        // Using Wisp proxy - try different formats
        const encodedUrl = encodeURIComponent(url);
        
        // Option 1: Public Wisp gateway (usually works)
        return `https://wisp.ilnk.info/${encodedUrl}`;
        
        // Option 2: Alternative gateway
        // return `https://wisp.isthe.link/${encodedUrl}`;
        
        // Option 3: Try without proxy for testing
        // return url;
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
        const isSearchQuery = url.includes(' ') || (!url.includes('.') && !url.includes('://'));
        
        if (isSearchQuery) {
            // Convert to DuckDuckGo search
            const searchQuery = encodeURIComponent(url);
            finalUrl = `https://duckduckgo.com/?q=${searchQuery}&ia=web`;
        } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            // Add https:// if missing
            finalUrl = 'https://' + finalUrl;
        }
        
        // Update tab
        tab.url = finalUrl;
        tab.title = this.extractDomain(finalUrl);
        tab.isNewTab = false;
        
        if (tab.element) {
            tab.element.querySelector('.tab-title').textContent = tab.title;
        }
        
        // Get proxy URL
        const proxyUrl = this.getProxyUrl(finalUrl);
        console.log('Proxy URL:', proxyUrl);
        
        // Create iframe
        const iframeHtml = `<iframe class="browser-frame" id="frame-${tabId}" src="${proxyUrl}" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>`;
        
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
        
        // Setup iframe load handlers
        setTimeout(() => {
            const frame = document.getElementById(`frame-${tabId}`);
            if (frame) {
                frame.onload = () => {
                    this.hideLoading();
                    console.log('Page loaded');
                };
                
                frame.onerror = (error) => {
                    this.hideLoading();
                    console.error('Frame error:', error);
                    this.showError(tabId, 'Failed to load page. Try a different site.');
                };
            }
        }, 100);
        
        // Update URL bar and history
        this.urlInput.value = finalUrl;
        tab.history.push(finalUrl);
        tab.historyIndex = tab.history.length - 1;
        this.updateNavButtons();
        
        // Auto-hide loading indicator
        setTimeout(() => this.hideLoading(), 5000);
    }
    
    showError(tabId, message) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (tab && tab.content) {
            tab.content.innerHTML = `
                <div class="new-tab-page">
                    <div class="new-tab-logo" style="color: #ef4444;">/Purge</div>
                    <p style="color: var(--text); margin-bottom: 1rem; font-size: 1.2rem;">Error</p>
                    <p style="color: var(--text); margin-bottom: 2rem;">${message}</p>
                    <div style="margin-top: 1rem;">
                        <button class="go-btn" onclick="window.location.reload()">
                            <i class="fas fa-redo"></i> Reload
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            let domain = urlObj.hostname.replace('www.', '');
            return domain.length > 20 ? domain.substring(0, 17) + '...' : domain;
        } catch {
            return url.includes('duckduckgo.com') ? 'DuckDuckGo' : 'Website';
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
            this.loadUrlInTab(activeTab.id, 'about:blank');
            setTimeout(() => {
                activeTab.url = null;
                activeTab.title = 'New Tab';
                activeTab.isNewTab = true;
                if (activeTab.element) {
                    activeTab.element.querySelector('.tab-title').textContent = 'New Tab';
                }
                activeTab.content.innerHTML = this.createNewTabPage();
                this.urlInput.value = '';
                activeTab.history = [];
                activeTab.historyIndex = -1;
                this.updateNavButtons();
            }, 100);
        }
    }
    
    updateNavButtons() {
        const activeTab = this.getActiveTab();
        if (activeTab) {
            document.getElementById('back-btn').disabled = activeTab.historyIndex <= 0;
            document.getElementById('forward-btn').disabled = activeTab.historyIndex >= activeTab.history.length - 1;
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.browser = new Browser();
});