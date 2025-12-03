class Browser {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.nextTabId = 1;
        this.tabsBar = document.getElementById('tabs-bar');
        this.contentArea = document.getElementById('content-area');
        this.urlInput = document.getElementById('url-input');
        this.loadingIndicator = document.getElementById('loading-indicator');
        
        // Embed-friendly proxies (from your corn.ts and others)
        this.embedProxies = [
            // CORS proxies (allow embedding)
            {
                name: 'CorsProxy.io',
                getUrl: (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
            },
            {
                name: 'AllOrigins',
                getUrl: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
            },
            {
                name: 'CodeTabs Proxy',
                getUrl: (url) => `https://api.codetabs.com/v1/proxy/?quest=${url}`
            },
            
            // Public web proxies (often allow embedding)
            {
                name: 'CroxyProxy',
                getUrl: (url) => `https://www.croxyproxy.com/_${encodeURIComponent(url)}`
            },
            {
                name: 'CroxyProxy RO',
                getUrl: (url) => `https://ro.croxyproxy.com/_${encodeURIComponent(url)}`
            },
            
            // Alternative scramjet domains (might not block)
            {
                name: 'Scramjet Mirror 1',
                getUrl: (url) => `https://proxy.astroid.cc/scramjet/${encodeURIComponent(url)}`
            },
            {
                name: 'Scramjet Mirror 2',
                getUrl: (url) => `https://surf.leaks.sh/scramjet/${encodeURIComponent(url)}`
            },
            
            // Your original proxies with different paths
            {
                name: 'Lunaar Direct',
                getUrl: (url) => `https://lunaar.org/go/${encodeURIComponent(url)}`
            },
            {
                name: 'Lunaar Proxy',
                getUrl: (url) => `https://lunaar.org/proxy/${encodeURIComponent(url)}`
            },
            
            // Bare proxies (might work better)
            {
                name: 'Incog Bare',
                getUrl: (url) => `https://incog.works/bare/${encodeURIComponent(url)}`
            },
            {
                name: 'DefinitelyScience Bare',
                getUrl: (url) => `https://definitelyscience.com/bare/${encodeURIComponent(url)}`
            },
            {
                name: 'Lichology Bare',
                getUrl: (url) => `https://lichology.com/bare/${encodeURIComponent(url)}`
            }
        ];
        
        this.currentProxy = 0;
        this.failedProxies = new Set();
        
        this.init();
    }
    
    init() {
        console.log('Initializing with embed-friendly proxies...');
        
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
            contentElement.innerHTML = '<div class="loading-placeholder">Loading...</div>';
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
                <p style="color: var(--text); margin-bottom: 2rem; font-size: 1.2rem;">Multi-Proxy Browser</p>
                <div class="new-tab-search">
                    <input type="text" class="new-tab-input" placeholder="Search DuckDuckGo or enter website URL">
                </div>
                <div class="quick-links">
                    <div class="quick-link" data-url="https://duckduckgo.com">
                        <i class="fas fa-search"></i>
                        <div class="quick-link-title">DuckDuckGo</div>
                        <div class="quick-link-desc">Search</div>
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
                </div>
                <div style="margin-top: 2rem; color: var(--text); font-size: 0.9rem; background: rgba(139, 92, 246, 0.1); padding: 1rem; border-radius: 8px; max-width: 600px;">
                    <p><strong>Available Proxies:</strong> ${this.embedProxies.length}</p>
                    <p><strong>Current:</strong> ${this.embedProxies[this.currentProxy].name}</p>
                    <p><strong>Auto-rotate:</strong> Enabled on failure</p>
                </div>
            </div>
        `;
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
            this.activeTabId = tabId;
            
            this.urlInput.value = activeTab.url || '';
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
    
    async loadUrlInTab(tabId, url) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (!tab || !url) return;
        
        this.showLoading();
        
        // Process URL
        let finalUrl = url.trim();
        
        // Handle search queries
        const isSearchQuery = url.includes(' ') || 
                             (!url.includes('.') && !url.includes('://') && !url.startsWith('http'));
        
        if (isSearchQuery) {
            const searchQuery = encodeURIComponent(url);
            finalUrl = `https://duckduckgo.com/?q=${searchQuery}&ia=web`;
        } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }
        
        tab.url = finalUrl;
        tab.title = this.extractDomain(finalUrl);
        tab.isNewTab = false;
        
        if (tab.element) {
            tab.element.querySelector('.tab-title').textContent = tab.title;
        }
        
        // Try proxies until one works
        await this.tryProxies(tabId, finalUrl, tab);
    }
    
    async tryProxies(tabId, finalUrl, tab, startIndex = 0) {
        for (let i = startIndex; i < this.embedProxies.length; i++) {
            const proxy = this.embedProxies[i];
            
            if (this.failedProxies.has(proxy.name)) {
                console.log(`Skipping failed proxy: ${proxy.name}`);
                continue;
            }
            
            this.currentProxy = i;
            const proxyUrl = proxy.getUrl(finalUrl);
            
            console.log(`Trying proxy ${i + 1}/${this.embedProxies.length}: ${proxy.name}`);
            
            try {
                // Test if proxy is accessible
                const testResponse = await fetch(proxyUrl, {
                    method: 'HEAD',
                    mode: 'no-cors'
                }).catch(() => null);
                
                // Create iframe
                const iframeHtml = `
                    <iframe class="browser-frame" 
                            id="frame-${tabId}" 
                            src="${proxyUrl}"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            referrerpolicy="no-referrer"
                            style="width:100%; height:100%; border:none;">
                    </iframe>
                `;
                
                this.updateTabContent(tab, iframeHtml);
                
                // Set up success/error handlers
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const frame = document.getElementById(`frame-${tabId}`);
                        if (frame) {
                            frame.onload = () => {
                                console.log(`Success with ${proxy.name}`);
                                this.hideLoading();
                                this.urlInput.value = finalUrl;
                                this.updateHistory(tab, finalUrl);
                                resolve(true);
                            };
                            
                            frame.onerror = () => {
                                console.log(`${proxy.name} failed, trying next...`);
                                this.failedProxies.add(proxy.name);
                                this.tryProxies(tabId, finalUrl, tab, i + 1);
                                resolve(false);
                            };
                        } else {
                            this.failedProxies.add(proxy.name);
                            this.tryProxies(tabId, finalUrl, tab, i + 1);
                            resolve(false);
                        }
                    }, 100);
                });
                
            } catch (error) {
                console.log(`${proxy.name} failed:`, error);
                this.failedProxies.add(proxy.name);
                continue;
            }
        }
        
        // All proxies failed
        this.hideLoading();
        this.showProxyError(tabId);
    }
    
    updateTabContent(tab, html) {
        if (tab.content.querySelector('.new-tab-page') || tab.content.querySelector('.loading-placeholder')) {
            tab.content.innerHTML = html;
        } else {
            const frame = document.getElementById(`frame-${tab.id}`);
            if (frame) {
                frame.outerHTML = html;
            } else {
                tab.content.innerHTML = html;
            }
        }
    }
    
    showProxyError(tabId) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (tab && tab.content) {
            tab.content.innerHTML = `
                <div class="new-tab-page">
                    <div class="new-tab-logo" style="color: #ef4444;">/Purge</div>
                    <p style="color: var(--text); margin-bottom: 1rem; font-size: 1.2rem;">All Proxies Failed</p>
                    <p style="color: var(--text); margin-bottom: 2rem;">Could not find a working proxy that allows embedding.</p>
                    
                    <div style="background: rgba(139, 92, 246, 0.1); padding: 1.5rem; border-radius: 8px; margin: 1rem 0; max-width: 500px;">
                        <p style="color: var(--text); margin-bottom: 0.5rem;"><strong>Solutions:</strong></p>
                        <ul style="color: var(--text); text-align: left; display: inline-block;">
                            <li>Try a different website</li>
                            <li>Some sites block all proxy embedding</li>
                            <li>Try using the site directly</li>
                            <li>Failed proxies: ${Array.from(this.failedProxies).join(', ')}</li>
                        </ul>
                    </div>
                    
                    <div style="margin-top: 1.5rem;">
                        <button class="go-btn" onclick="window.browser.retryWithNewProxy(${tabId})">
                            <i class="fas fa-sync-alt"></i> Try Another Proxy
                        </button>
                        <button class="go-btn" onclick="window.browser.goHome()" style="background: var(--background); margin-left: 0.5rem;">
                            <i class="fas fa-home"></i> Home
                        </button>
                    </div>
                </div>
            `;
        }
    }
    
    retryWithNewProxy(tabId) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        if (tab && tab.url) {
            // Clear failed proxies and retry
            this.failedProxies.clear();
            this.currentProxy = (this.currentProxy + 1) % this.embedProxies.length;
            this.loadUrlInTab(tabId, tab.url);
        }
    }
    
    updateHistory(tab, finalUrl) {
        if (tab.historyIndex === -1 || tab.history[tab.historyIndex] !== finalUrl) {
            tab.history = tab.history.slice(0, tab.historyIndex + 1);
            tab.history.push(finalUrl);
            tab.historyIndex = tab.history.length - 1;
        }
        this.updateNavButtons();
    }
    
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            let domain = urlObj.hostname;
            
            if (domain.startsWith('www.')) {
                domain = domain.substring(4);
            }
            
            if (domain.length > 20) {
                domain = domain.substring(0, 17) + '...';
            }
            
            return domain;
        } catch {
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.browser = new Browser();
    console.log('Multi-Proxy Browser ready with', window.browser.embedProxies.length, 'proxies');
});