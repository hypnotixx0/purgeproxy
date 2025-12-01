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
        const addTabBtn = document.createElement('div');
        addTabBtn.className = 'add-tab';
        addTabBtn.id = 'add-tab-btn';
        addTabBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addTabBtn.addEventListener('click', () => this.createTab());
        this.tabsBar.appendChild(addTabBtn);
        
        this.createTab();
        
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
        
        document.addEventListener('keypress', (e) => {
            if (e.target.classList.contains('new-tab-input') && e.key === 'Enter') {
                const url = e.target.value.trim();
                const activeTab = this.getActiveTab();
                if (activeTab && url) {
                    this.loadUrlInTab(activeTab.id, url);
                }
            }
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+T or Cmd+T for new tab
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.createTab();
            }
            
            // Ctrl+W or Cmd+W to close tab
            if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                e.preventDefault();
                const activeTab = this.getActiveTab();
                if (activeTab) this.closeTab(activeTab.id);
            }
            
            // Ctrl+Tab to switch tabs
            if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
                e.preventDefault();
                this.cycleTabs(e.shiftKey ? -1 : 1);
            }
            
            // F5 to refresh
            if (e.key === 'F5') {
                e.preventDefault();
                this.refresh();
            }
            
            // Ctrl+L or Alt+D to focus address bar
            if ((e.ctrlKey && e.key === 'l') || (e.altKey && e.key === 'd')) {
                e.preventDefault();
                this.urlInput.focus();
                this.urlInput.select();
            }
        });
    }
    
    cycleTabs(direction) {
        if (this.tabs.length <= 1) return;
        
        const currentIndex = this.tabs.findIndex(tab => tab.id === this.activeTabId);
        let newIndex = currentIndex + direction;
        
        if (newIndex < 0) newIndex = this.tabs.length - 1;
        if (newIndex >= this.tabs.length) newIndex = 0;
        
        this.switchToTab(this.tabs[newIndex].id);
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
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.setAttribute('data-tab-id', tab.id);
        tabElement.innerHTML = `
            <div class="tab-favicon"><i class="fas fa-globe"></i></div>
            <div class="tab-title">${tab.title}</div>
            <button class="tab-close"><i class="fas fa-times"></i></button>
        `;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'browser-frame-container';
        contentElement.id = `tab-content-${tab.id}`;
        
        if (tab.isNewTab) {
            contentElement.innerHTML = this.createNewTabPage();
        } else {
            contentElement.innerHTML = `<iframe class="browser-frame" id="frame-${tab.id}" src="${this.getProxyUrl(tab.url)}"></iframe>`;
        }
        
        this.tabsBar.insertBefore(tabElement, document.getElementById('add-tab-btn'));
        this.contentArea.appendChild(contentElement);
        
        tabElement.addEventListener('click', (e) => {
            if (!e.target.closest('.tab-close')) {
                this.switchToTab(tab.id);
            }
        });
        
        tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });
        
        tab.element = tabElement;
        tab.content = contentElement;
    }
    
    createNewTabPage() {
        return `
            <div class="new-tab-page">
                <div class="new-tab-logo">/Purge</div>
                <p style="color: var(--text); margin-bottom: 2rem; font-size: 1.2rem;">Full Web Proxy</p>
                <div class="new-tab-search">
                    <input type="text" class="new-tab-input" placeholder="Enter website address or search query">
                </div>
                <div class="quick-links">
                    <div class="quick-link" data-url="https://orteil.dashnet.org/cookieclicker/">
                        <i class="fas fa-cookie"></i>
                        <div class="quick-link-title">Cookie Clicker</div>
                        <div class="quick-link-desc">Test Game</div>
                    </div>
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
                    <div class="quick-link" data-url="https://discord.com">
                        <i class="fab fa-discord"></i>
                        <div class="quick-link-title">Discord</div>
                        <div class="quick-link-desc">Chat</div>
                    </div>
                </div>
                <div class="proxy-info" style="margin-top: 2rem; padding: 1rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px;">
                    <p style="color: var(--text); margin-bottom: 0.5rem;"><strong>Search Tips:</strong></p>
                    <ul style="color: var(--text); text-align: left; display: inline-block; margin: 0;">
                        <li>Enter any URL to visit websites</li>
                        <li>Type search terms to search via DuckDuckGo</li>
                        <li>Proxy Server: wss://lichology.com/wisp/</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    getProxyUrl(url) {
        // Use your Wisp server
        const encodedUrl = encodeURIComponent(url);
        return `https://wisp.ilnk.info/proxy?url=${encodedUrl}`;
        // Alternative format if needed:
        // return `https://wisp.ilnk.info/proxy/${encodedUrl}`;
    }
    
    switchToTab(tabId) {
        this.tabs.forEach(tab => {
            if (tab.content) tab.content.classList.remove('active');
            if (tab.element) tab.element.classList.remove('active');
        });
        const activeTab = this.tabs.find(tab => tab.id === tabId);
        if (activeTab) {
            if (activeTab.content) activeTab.content.classList.add('active');
            if (activeTab.element) activeTab.element.classList.add('active');
        }
        this.activeTabId = tabId;
        if (activeTab) {
            if (activeTab.isNewTab) {
                this.urlInput.value = '';
                this.urlInput.placeholder = "Enter website address or search query";
            } else {
                this.urlInput.value = activeTab.url;
                this.urlInput.placeholder = "Enter URL or search terms";
            }
        }
        this.updateNavButtons();
    }
    
    closeTab(tabId) {
        if (this.tabs.length <= 1) return;
        const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
        if (tabIndex === -1) return;
        const tab = this.tabs[tabIndex];
        if (tab.element) tab.element.remove();
        if (tab.content) tab.content.remove();
        this.tabs.splice(tabIndex, 1);
        if (this.activeTabId === tabId) {
            const newActiveTab = this.tabs[Math.max(0, tabIndex - 1)];
            this.switchToTab(newActiveTab.id);
        }
    }
    
    getActiveTab() {
        return this.tabs.find(tab => tab.id === this.activeTabId);
    }
    
    navigate() {
        const url = this.urlInput.value.trim();
        const activeTab = this.getActiveTab();
        if (activeTab && url) {
            this.loadUrlInTab(activeTab.id, url);
        }
    }
    
    loadUrlInTab(tabId, url) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (!tab || !url) return;
        this.showLoading();
        
        // Check if it's a search query (contains spaces or is not a valid URL)
        const isSearchQuery = url.includes(' ') || 
                             (!url.includes('.') && !url.startsWith('http://') && !url.startsWith('https://'));
        
        if (isSearchQuery) {
            // Auto-use DuckDuckGo for search queries
            const searchQuery = encodeURIComponent(url);
            url = `https://duckduckgo.com/html/?q=${searchQuery}`;
        } else {
            // Add protocol if missing
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
        }
        
        tab.url = url;
        tab.title = this.extractDomain(url);
        tab.isNewTab = false;
        
        if (tab.element) {
            tab.element.querySelector('.tab-title').textContent = tab.title;
        }
        
        // Set up iframe with error handling
        const setupIframe = () => {
            const frame = document.getElementById(`frame-${tabId}`);
            if (frame) {
                frame.onload = () => {
                    this.hideLoading();
                    // Check for common error pages
                    try {
                        const frameDoc = frame.contentDocument || frame.contentWindow.document;
                        if (frameDoc.body && (
                            frameDoc.body.innerText.includes('Cloudflare') ||
                            frameDoc.body.innerText.includes('Direct IP access') ||
                            frameDoc.body.innerText.includes('Error 1003')
                        )) {
                            this.showError(tabId, 'Website blocked by Cloudflare. Try a different site or wait a few minutes.');
                        }
                    } catch (e) {
                        // Cross-origin restriction, assume it loaded fine
                    }
                };
                
                frame.onerror = () => {
                    this.hideLoading();
                    this.showError(tabId, 'Failed to load page. The website might be blocking proxy access.');
                };
            }
        };
        
        // Replace new tab page with iframe if needed
        if (tab.content.querySelector('.new-tab-page')) {
            tab.content.innerHTML = `<iframe class="browser-frame" id="frame-${tabId}" src="${this.getProxyUrl(url)}"></iframe>`;
            setTimeout(setupIframe, 100);
        } else {
            const frame = document.getElementById(`frame-${tabId}`);
            if (frame) {
                frame.src = this.getProxyUrl(url);
                setupIframe();
            }
        }
        
        this.urlInput.value = url;
        tab.history = tab.history.slice(0, tab.historyIndex + 1);
        tab.history.push(url);
        tab.historyIndex = tab.history.length - 1;
        this.updateNavButtons();
        
        // Auto-hide loading after timeout
        setTimeout(() => this.hideLoading(), 8000);
    }
    
    showError(tabId, message) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (tab && tab.content) {
            tab.content.innerHTML = `
                <div class="new-tab-page">
                    <div class="new-tab-logo" style="color: #ef4444;">/Purge</div>
                    <p style="color: var(--text); margin-bottom: 1rem; font-size: 1.2rem;">🚫 Proxy Error</p>
                    <p style="color: var(--text); margin-bottom: 2rem;">${message}</p>
                    <div style="background: rgba(139, 92, 246, 0.1); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                        <p style="color: var(--text); margin-bottom: 0.5rem;"><strong>Try these solutions:</strong></p>
                        <ul style="color: var(--text); text-align: left; display: inline-block;">
                            <li>Wait a few minutes and try again</li>
                            <li>Try a different website</li>
                            <li>The site might be blocking proxy access</li>
                            <li>Search queries automatically use DuckDuckGo</li>
                        </ul>
                    </div>
                    <div style="margin-top: 1rem;">
                        <button class="go-btn" onclick="window.browser?.refresh()" style="margin-right: 0.5rem;">
                            <i class="fas fa-redo"></i> Retry
                        </button>
                        <button class="go-btn" onclick="window.browser?.goHome()" style="background: var(--background);">
                            <i class="fas fa-home"></i> Home
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    extractDomain(url) {
        try {
            const domain = new URL(url).hostname;
            return domain.replace('www.', '').substring(0, 20) + (domain.length > 20 ? '...' : '');
        } catch {
            // Check if it's a search query
            if (url.includes('duckduckgo.com')) {
                return 'DuckDuckGo Search';
            }
            return 'Loading...';
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
            activeTab.url = null;
            activeTab.title = 'New Tab';
            activeTab.isNewTab = true;
            if (activeTab.element) {
                activeTab.element.querySelector('.tab-title').textContent = 'New Tab';
            }
            activeTab.content.innerHTML = this.createNewTabPage();
            this.urlInput.value = '';
            this.urlInput.placeholder = "Enter website address or search query";
            activeTab.history = [];
            activeTab.historyIndex = -1;
            this.updateNavButtons();
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

// Make browser instance globally accessible
window.browser = null;

document.addEventListener('DOMContentLoaded', function() {
    window.browser = new Browser();
});
