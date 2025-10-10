const watchlistForm = document.getElementById('watchlist-form');
const watchlistInput = document.getElementById('watchlist-input');
const watchlistItems = document.getElementById('watchlist-items');
const newsContainer = document.getElementById('news-container');
const yearEl = document.getElementById('year');

const sampleNews = [
  {
    title: 'Solana validator uptime improves ahead of upgrade',
    summary:
      'Telemetry nodes flag a 9% improvement in epoch uptime while Solana Foundation highlights new client releases shipping quic-based networking.',
    tags: ['SOL', 'Validator health', 'Infrastructure'],
    source: 'Solana Chain AI',
    time: '8 minutes ago'
  },
  {
    title: 'Stablecoin flows rotate toward Solana DeFi',
    summary:
      'AI wallet clustering shows $74M in net inflows to Solana AMMs as liquidity providers chase higher fee tiers post-governance vote.',
    tags: ['DeFi', 'Stablecoins', 'Solana'],
    source: 'Flowsight AI',
    time: '22 minutes ago'
  },
  {
    title: 'Federal Reserve signals data-dependent rate path',
    summary:
      'FOMC minutes highlight a split between hawks and doves while AI sentiment flags elevated mentions of “soft landing” across macro reports.',
    tags: ['Fed policy', 'Rates', 'Macro'],
    source: 'MacroPulse AI',
    time: '36 minutes ago'
  },
  {
    title: 'Copper futures jump on China stimulus hints',
    summary:
      'AI translation of local policy drafts suggests accelerated infrastructure spending, supporting demand-sensitive commodities.',
    tags: ['Commodities', 'China', 'Stimulus'],
    source: 'GlobalFluent AI',
    time: '2 hours ago'
  }
];

if (watchlistForm && watchlistInput && watchlistItems && newsContainer) {
  const activeWatchlist = new Set();

  function renderWatchlist() {
    watchlistItems.innerHTML = '';

    if (activeWatchlist.size === 0) {
      const emptyState = document.createElement('li');
      emptyState.className = 'empty';
      emptyState.textContent = 'No items yet. Add a ticker or theme to start tracking.';
      watchlistItems.appendChild(emptyState);
      newsContainer.innerHTML = '';
      return;
    }

    activeWatchlist.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        activeWatchlist.delete(item);
        renderWatchlist();
        renderNews();
      });

      li.appendChild(removeBtn);
      watchlistItems.appendChild(li);
    });
  }

  function renderNews() {
    newsContainer.innerHTML = '';

    if (activeWatchlist.size === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'news-card empty';
      emptyState.innerHTML = '<p>Add items to your watchlist to see curated intelligence here.</p>';
      newsContainer.appendChild(emptyState);
      return;
    }

    const watchlistArray = Array.from(activeWatchlist);

    const filtered = sampleNews.filter((news) =>
      watchlistArray.some((item) =>
        news.tags.some((tag) => tag.toLowerCase().includes(item.toLowerCase())) ||
        news.title.toLowerCase().includes(item.toLowerCase()) ||
        news.summary.toLowerCase().includes(item.toLowerCase())
      )
    );

    if (filtered.length === 0) {
      const emptyCard = document.createElement('div');
      emptyCard.className = 'news-card empty';
      emptyCard.innerHTML = '<p>No signals yet. Our AI will notify you the moment something relevant hits the chain.</p>';
      newsContainer.appendChild(emptyCard);
      return;
    }

    filtered.forEach((news) => {
      const card = document.createElement('article');
      card.className = 'news-card';

      const title = document.createElement('h3');
      title.textContent = news.title;

      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.innerHTML = `<span class="badge">${news.source}</span><span>${news.time}</span>`;

      const summary = document.createElement('p');
      summary.textContent = news.summary;

      const tags = document.createElement('div');
      tags.className = 'meta tags';
      tags.innerHTML = news.tags.map((tag) => `<span class="tag">${tag}</span>`).join('');

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(summary);
      card.appendChild(tags);

      newsContainer.appendChild(card);
    });
  }

  watchlistForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = watchlistInput.value.trim();
    if (!value) return;

    activeWatchlist.add(value);
    watchlistInput.value = '';
    renderWatchlist();
    renderNews();
  });

  renderWatchlist();
  renderNews();
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
