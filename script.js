const volume24hEl = document.getElementById('volume-24h');
const volumeChangeEl = document.getElementById('volume-change');
const volumeAverageEl = document.getElementById('volume-average');
const volumeAverageNoteEl = document.getElementById('volume-average-note');
const priceEl = document.getElementById('eth-price');
const priceChangeEl = document.getElementById('price-change');
const volumeTableBody = document.getElementById('volume-table-body');
const volumeStatus = document.getElementById('volume-status');
const whaleTableBody = document.getElementById('whale-table-body');
const whaleStatus = document.getElementById('whale-status');
const whaleInsight = document.getElementById('whale-insight');
const lastUpdated = document.getElementById('last-updated');
const yearEl = document.getElementById('year');
const refreshAllBtn = document.getElementById('refresh-all');
const refreshVolumeBtn = document.getElementById('refresh-volume');
const whaleForm = document.getElementById('whale-form');
const thresholdInput = document.getElementById('min-value');
const walletConnectBtn = document.getElementById('wallet-connect');
const walletRefreshBtn = document.getElementById('wallet-refresh');
const walletStatusDisplay = document.getElementById('wallet-status');
const walletProviderNote = document.getElementById('wallet-provider-note');
const walletAddressDisplay = document.getElementById('wallet-address');
const walletNetworkDisplay = document.getElementById('wallet-network');
const walletBalanceDisplay = document.getElementById('wallet-balance');
const walletActionsSection = document.getElementById('wallet-actions');
const walletExplorerLink = document.getElementById('wallet-explorer');
const walletCopyBtn = document.getElementById('wallet-copy');
const walletActionStatus = document.getElementById('wallet-action-status');
const walletResetBtn = document.getElementById('wallet-reset');

const electronAPI = window.electronAPI;
const isElectron = Boolean(electronAPI);

let volumeChart;
let okxProvider;
let currentAccount;
let currentChainId;
let walletEventsBound = false;

const numberFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
});

const percentageFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const shortNumberFormatter = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1
});

const chainNameMap = new Map([
  ['0x1', 'Ethereum 主网'],
  ['0x5', 'Goerli 测试网'],
  ['0xaa36a7', 'Sepolia 测试网'],
  ['0x89', 'Polygon 主网'],
  ['0xa86a', 'Avalanche C-Chain'],
  ['0x38', 'BNB Chain'],
  ['0x2a', 'Kovan 测试网']
]);

const explorerBaseMap = new Map([
  ['0x1', 'https://www.oklink.com/cn/eth/address/'],
  ['0xaa36a7', 'https://www.oklink.com/cn/eth-sepolia/address/'],
  ['0x5', 'https://www.oklink.com/cn/eth-goerli/address/'],
  ['0x89', 'https://www.oklink.com/cn/polygon/address/'],
  ['0xa86a', 'https://www.oklink.com/cn/avax/address/'],
  ['0x38', 'https://www.oklink.com/cn/bsc/address/']
]);

function formatUsd(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }
  if (value >= 1_000_000) {
    return `${shortNumberFormatter.format(value)} USD`;
  }
  return numberFormatter.format(value);
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }
  if (!Number.isFinite(value)) {
    return '--';
  }
  return `${value > 0 ? '+' : ''}${percentageFormatter.format(value / 100)}`;
}

function trimHash(hash = '') {
  if (!hash) return '--';
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

function trimAddress(address = '') {
  if (!address) return '--';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function openExternal(url) {
  if (!url) return;
  if (isElectron) {
    electronAPI.openExternal(url);
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

function getOkxProvider() {
  const { okxwallet, ethereum } = window;
  if (okxwallet?.ethereum) return okxwallet.ethereum;
  if (okxwallet?.isOkxWallet) return okxwallet;
  if (ethereum?.providers) {
    return ethereum.providers.find((provider) => provider?.isOkxWallet);
  }
  if (ethereum?.isOkxWallet) return ethereum;
  return null;
}

function formatEthFromHexWei(weiHex) {
  if (!weiHex) return '--';
  try {
    const wei = BigInt(weiHex);
    const base = 10n ** 18n;
    const whole = wei / base;
    const fraction = wei % base;
    if (fraction === 0n) {
      return whole.toString();
    }
    const fractionString = fraction
      .toString()
      .padStart(18, '0')
      .slice(0, 6)
      .replace(/0+$/, '');
    return fractionString ? `${whole}.${fractionString}` : whole.toString();
  } catch (error) {
    console.error('formatEthFromHexWei error', error);
    return '--';
  }
}

function mapChainIdToName(chainId) {
  if (!chainId) return '--';
  const normalized = chainId.toLowerCase();
  return chainNameMap.get(normalized) ?? `链 ID ${chainId}`;
}

function getExplorerBase(chainId) {
  if (!chainId) return explorerBaseMap.get('0x1');
  const normalized = chainId.toLowerCase();
  return explorerBaseMap.get(normalized) ?? explorerBaseMap.get('0x1');
}

function updateExplorerLink() {
  if (!walletExplorerLink) return;
  if (!currentAccount) {
    walletExplorerLink.setAttribute('aria-disabled', 'true');
    walletExplorerLink.href = '#';
    return;
  }
  const base = getExplorerBase(currentChainId);
  walletExplorerLink.href = `${base}${currentAccount}`;
  walletExplorerLink.removeAttribute('aria-disabled');
}

function setWalletDisconnected(statusText = '未连接', noteText) {
  if (!walletStatusDisplay) return;
  walletStatusDisplay.textContent = statusText;
  if (noteText && walletProviderNote) {
    walletProviderNote.textContent = noteText;
  }
  if (walletAddressDisplay) {
    walletAddressDisplay.textContent = '--';
    walletAddressDisplay.title = '--';
  }
  if (walletNetworkDisplay) {
    walletNetworkDisplay.textContent = '--';
  }
  if (walletBalanceDisplay) {
    walletBalanceDisplay.textContent = '--';
  }
  if (walletCopyBtn) {
    walletCopyBtn.disabled = true;
  }
  if (walletRefreshBtn) {
    walletRefreshBtn.disabled = true;
  }
  if (walletActionsSection) {
    walletActionsSection.hidden = true;
  }
  if (walletActionStatus) {
    walletActionStatus.textContent = '连接后可以复制地址或在 OKLink 查看账户详情。';
  }
  if (walletExplorerLink) {
    walletExplorerLink.setAttribute('aria-disabled', 'true');
    walletExplorerLink.href = '#';
  }
  currentAccount = null;
  currentChainId = null;
}

function displayStatusMessage(message) {
  if (!message) {
    return;
  }
  if (walletActionsSection && !walletActionsSection.hidden && walletActionStatus) {
    walletActionStatus.textContent = message;
  }
  if (volumeStatus) {
    volumeStatus.textContent = message;
  }
}

async function refreshWalletDetails(chainIdOverride) {
  if (!okxProvider || !currentAccount) return;
  if (walletRefreshBtn) {
    walletRefreshBtn.disabled = true;
  }
  if (walletActionStatus) {
    walletActionStatus.textContent = '正在刷新账户信息…';
  }
  try {
    const chainId = chainIdOverride ?? (await okxProvider.request({ method: 'eth_chainId' }));
    currentChainId = chainId;
    if (walletNetworkDisplay) {
      walletNetworkDisplay.textContent = mapChainIdToName(chainId);
    }
    const balanceHex = await okxProvider.request({
      method: 'eth_getBalance',
      params: [currentAccount, 'latest']
    });
    if (walletBalanceDisplay) {
      walletBalanceDisplay.textContent = `${formatEthFromHexWei(balanceHex)} ETH`;
    }
    updateExplorerLink();
    if (walletActionStatus) {
      walletActionStatus.textContent = '账户信息已更新。';
    }
  } catch (error) {
    console.error(error);
    if (walletActionStatus) {
      walletActionStatus.textContent = `刷新失败：${error?.message ?? error}`;
    }
  } finally {
    if (walletRefreshBtn) {
      walletRefreshBtn.disabled = false;
    }
  }
}

function handleAccountsChanged(accounts = []) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    setWalletDisconnected('等待授权', '请在钱包中授权连接。');
    return;
  }
  currentAccount = accounts[0];
  if (walletStatusDisplay) {
    walletStatusDisplay.textContent = '已连接';
  }
  if (walletProviderNote) {
    walletProviderNote.textContent = '连接成功，如需刷新数据请点击“刷新信息”。';
  }
  if (walletAddressDisplay) {
    walletAddressDisplay.textContent = trimAddress(currentAccount);
    walletAddressDisplay.title = currentAccount;
  }
  if (walletCopyBtn) {
    walletCopyBtn.disabled = false;
  }
  if (walletRefreshBtn) {
    walletRefreshBtn.disabled = false;
  }
  if (walletActionsSection) {
    walletActionsSection.hidden = false;
  }
  if (walletActionStatus) {
    walletActionStatus.textContent = '连接成功，可使用下方快捷操作。';
  }
  updateExplorerLink();
  refreshWalletDetails();
}

function handleChainChanged(chainId) {
  refreshWalletDetails(chainId);
}

function bindWalletEvents(provider) {
  if (!provider || walletEventsBound !== false) return;
  if (typeof provider.on === 'function') {
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);
    walletEventsBound = true;
  }
}

async function connectOkxWallet() {
  const provider = getOkxProvider();
  if (!provider) {
    const note = isElectron
      ? '未检测到钱包。请确保已在默认浏览器安装 OKX Wallet 扩展，或使用移动端 DApp 浏览器扫码授权。'
      : '请安装 OKX Wallet 浏览器插件或使用移动端 DApp 浏览器。';
    setWalletDisconnected('未检测到钱包', note);
    openExternal('https://www.okx.com/cn/web3');
    return;
  }
  okxProvider = provider;
  bindWalletEvents(okxProvider);
  if (walletStatusDisplay) {
    walletStatusDisplay.textContent = '正在请求授权…';
  }
  if (walletProviderNote) {
    walletProviderNote.textContent = '请在弹出的 OKX Wallet 窗口中确认连接请求。';
  }
  try {
    const accounts = await okxProvider.request({ method: 'eth_requestAccounts' });
    handleAccountsChanged(accounts);
  } catch (error) {
    console.error(error);
    if (error?.code === 4001) {
      setWalletDisconnected('用户拒绝了连接', '请在钱包中允许本页面访问账户。');
    } else {
      setWalletDisconnected('连接失败', `错误：${error?.message ?? error}`);
    }
  }
}

function setupWalletModule() {
  if (!walletStatusDisplay) return;
  const provider = getOkxProvider();
  if (!provider) {
    const note = isElectron
      ? '未检测到 OKX Wallet。请在默认浏览器安装扩展后重新打开应用，或使用移动端钱包扫码。'
      : '等待浏览器注入 OKX Wallet。';
    setWalletDisconnected('未检测', note);
    return;
  }
  okxProvider = provider;
  bindWalletEvents(okxProvider);
  if (walletProviderNote) {
    walletProviderNote.textContent = '检测到 OKX Wallet，点击上方按钮完成连接。';
  }
  okxProvider
    .request({ method: 'eth_accounts' })
    .then((accounts) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        handleAccountsChanged(accounts);
      } else {
        setWalletDisconnected('等待授权', '点击连接按钮并在钱包中确认。');
      }
    })
    .catch(() => {
      setWalletDisconnected('等待连接', '点击连接按钮授权访问。');
    });
}

function formatEthFromWei(weiString) {
  if (!weiString) return '--';
  const normalized = weiString.replace(/^0+/, '') || '0';
  if (normalized === '0') return '0';
  if (normalized.length <= 18) {
    return `0.${normalized.padStart(18, '0').slice(0, 6)}`;
  }
  const whole = normalized.slice(0, -18);
  const fraction = normalized.slice(-18).replace(/0+$/, '').slice(0, 6);
  return fraction ? `${whole}.${fraction}` : whole;
}

function setTrendClass(element, value) {
  element.classList.remove('positive', 'negative');
  if (value > 0) {
    element.classList.add('positive');
  } else if (value < 0) {
    element.classList.add('negative');
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`请求失败：${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function loadVolumeData() {
  volumeStatus.textContent = '正在加载交易量数据…';
  try {
    const [marketData, historyData] = await Promise.all([
      fetchJson('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum&price_change_percentage=24h'),
      fetchJson('https://api.coingecko.com/api/v3/coins/ethereum/market_chart?vs_currency=usd&days=7&interval=daily')
    ]);

    if (!Array.isArray(marketData) || marketData.length === 0) {
      throw new Error('未获取到市场数据');
    }

    const market = marketData[0];
    const totalVolume24h = market.total_volume;
    const price = market.current_price;
    const priceChange = market.price_change_percentage_24h;

    volume24hEl.textContent = formatUsd(totalVolume24h);
    volumeChangeEl.textContent = formatPercent(market.market_cap_change_percentage_24h ?? 0);
    setTrendClass(volumeChangeEl, market.market_cap_change_percentage_24h ?? 0);

    priceEl.textContent = numberFormatter.format(price);
    priceChangeEl.textContent = `24h: ${formatPercent(priceChange ?? 0)}`;
    setTrendClass(priceChangeEl, priceChange ?? 0);

    const volumes = historyData.total_volumes || [];
    const formatted = volumes.map(([timestamp, value]) => ({
      date: new Date(timestamp),
      value
    }));

    if (formatted.length === 0) {
      throw new Error('历史交易量数据为空');
    }

    const lastSeven = formatted.slice(-7);
    const previousDay = lastSeven.length >= 2 ? lastSeven[lastSeven.length - 2] : null;
    const latestDay = lastSeven[lastSeven.length - 1];
    const average = lastSeven.reduce((sum, item) => sum + item.value, 0) / lastSeven.length;

    volumeAverageEl.textContent = formatUsd(average);
    if (previousDay && latestDay && previousDay.value !== 0) {
      const diff = ((latestDay.value - previousDay.value) / previousDay.value) * 100;
      volumeAverageNoteEl.textContent = `最新日变化：${formatPercent(diff)}`;
      setTrendClass(volumeAverageNoteEl, diff);
    } else {
      volumeAverageNoteEl.textContent = '等待更多历史数据…';
    }

    if (latestDay && previousDay && previousDay.value !== 0) {
      const dayChange = ((latestDay.value - previousDay.value) / previousDay.value) * 100;
      volumeChangeEl.textContent = `较昨日：${formatPercent(dayChange)}`;
      setTrendClass(volumeChangeEl, dayChange);
    }

    volumeTableBody.innerHTML = '';
    lastSeven.forEach((item, index) => {
      const prev = index === 0 ? null : lastSeven[index - 1];
      const row = document.createElement('tr');
      const change = prev && prev.value !== 0 ? ((item.value - prev.value) / prev.value) * 100 : null;

      row.innerHTML = `
        <td>${item.date.toLocaleDateString('zh-CN')}</td>
        <td>${formatUsd(item.value)}</td>
        <td>${change === null ? '—' : formatPercent(change)}</td>
      `;

      if (change !== null) {
        const changeCell = row.cells[2];
        if (change > 0) {
          changeCell.style.color = 'var(--positive)';
        } else if (change < 0) {
          changeCell.style.color = 'var(--negative)';
        }
      }

      volumeTableBody.appendChild(row);
    });

    renderVolumeChart(lastSeven);
    volumeStatus.textContent = `数据更新时间：${new Date().toLocaleString('zh-CN', { hour12: false })}`;
    updateTimestamp();
  } catch (error) {
    console.error(error);
    volumeStatus.textContent = `交易量数据获取失败：${error.message}`;
  }
}

function renderVolumeChart(data) {
  const ctx = document.getElementById('volume-chart');
  const labels = data.map((item) => item.date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }));
  const values = data.map((item) => item.value);

  if (volumeChart) {
    volumeChart.destroy();
  }

  volumeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: '交易额 (USD)',
          data: values,
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          borderColor: '#38bdf8',
          backgroundColor: (context) => {
            const { chart } = context;
            const { ctx } = chart;
            const gradient = ctx.createLinearGradient(0, 0, 0, 220);
            gradient.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
            gradient.addColorStop(1, 'rgba(15, 23, 42, 0.05)');
            return gradient;
          },
          pointRadius: 3,
          pointBackgroundColor: '#bae6fd',
          pointBorderColor: '#0ea5e9'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `交易额：${formatUsd(context.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: 'rgba(148, 163, 184, 0.9)'
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.1)'
          }
        },
        y: {
          ticks: {
            color: 'rgba(148, 163, 184, 0.9)',
            callback: (value) => shortNumberFormatter.format(value)
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.08)'
          }
        }
      }
    }
  });
}

async function loadWhaleData(minValueUsd) {
  whaleStatus.textContent = '正在扫描大额交易…';
  try {
    const url = `https://api.blockchair.com/ethereum/transactions?q=value_usd(${Math.max(minValueUsd, 100000)}..)&s=block_id(desc)&limit=20`;
    const response = await fetchJson(url);
    const transactions = response.data || [];

    whaleTableBody.innerHTML = '';

    if (transactions.length === 0) {
      whaleTableBody.innerHTML = '<tr><td colspan="6">没有找到满足条件的大额交易。</td></tr>';
      whaleStatus.textContent = '可尝试降低阈值以捕获更多交易。';
      whaleInsight.textContent = '市场暂时缺乏巨鲸活动，资金面可能趋于冷静。';
      return;
    }

    const topTransaction = transactions[0];
    const largestUsd = Math.max(...transactions.map((tx) => tx.value_usd || 0));
    const medianUsd = transactions[Math.floor(transactions.length / 2)].value_usd || 0;

    whaleInsight.textContent = `最近一笔巨鲸交易发生在 ${topTransaction.time} (UTC)，金额约 ${formatUsd(topTransaction.value_usd)}。样本内最大金额为 ${formatUsd(largestUsd)}，中位数为 ${formatUsd(medianUsd)}。`;

    transactions.forEach((tx) => {
      const row = document.createElement('tr');
      const ethAmount = formatEthFromWei(tx.value);

      row.innerHTML = `
        <td>${tx.time ?? '--'}</td>
        <td><span class="badge">From</span> ${trimAddress(tx.sender ?? '')}</td>
        <td><span class="badge">To</span> ${trimAddress(tx.recipient ?? '')}</td>
        <td>${formatUsd(tx.value_usd)}</td>
        <td>${ethAmount} ETH</td>
        <td><a class="hash-link" href="https://etherscan.io/tx/${tx.hash}" target="_blank" rel="noopener">${trimHash(tx.hash)}</a></td>
      `;

      whaleTableBody.appendChild(row);
    });

    whaleStatus.textContent = `共捕获 ${transactions.length} 笔交易，最小阈值 ${formatUsd(minValueUsd)}。`;
    updateTimestamp();
  } catch (error) {
    console.error(error);
    whaleStatus.textContent = `巨鲸数据获取失败：${error.message}`;
  }
}

function updateTimestamp() {
  const now = new Date();
  lastUpdated.textContent = `最近更新：${now.toLocaleString('zh-CN', { hour12: false })}`;
}

function refreshAllData() {
  loadVolumeData();
  loadWhaleData(Number(thresholdInput.value));
}

function initialize() {
  yearEl.textContent = new Date().getFullYear();
  refreshAllData();
  setupWalletModule();
  setTimeout(() => {
    if (!okxProvider && walletStatusDisplay) {
      setupWalletModule();
    }
  }, 1500);

  if (isElectron) {
    document.body.classList.add('is-electron');
    electronAPI.onRefreshAll(() => {
      refreshAllData();
    });
    electronAPI.onStatusMessage((message) => {
      displayStatusMessage(message);
    });
    electronAPI.getAppVersion?.().then((version) => {
      if (!version) return;
      const headerMeta = document.querySelector('.header-meta');
      if (!headerMeta) return;
      if (headerMeta.querySelector('.app-badge')) return;
      const badge = document.createElement('span');
      badge.className = 'app-badge';
      badge.textContent = `macOS 应用 v${version}`;
      headerMeta.insertBefore(badge, headerMeta.firstChild);
    });
  }
}

refreshAllBtn.addEventListener('click', () => {
  refreshAllData();
  if (isElectron) {
    electronAPI.notifyRefresh();
  }
});

refreshVolumeBtn.addEventListener('click', () => {
  loadVolumeData();
});

whaleForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = Number(thresholdInput.value);
  if (!Number.isFinite(value) || value < 100000) {
    whaleStatus.textContent = '请输入不低于 100,000 USD 的阈值。';
    return;
  }
  loadWhaleData(value);
});

if (walletConnectBtn) {
  walletConnectBtn.addEventListener('click', connectOkxWallet);
}

if (walletRefreshBtn) {
  walletRefreshBtn.addEventListener('click', () => {
    refreshWalletDetails();
  });
}

if (walletCopyBtn) {
  walletCopyBtn.addEventListener('click', async () => {
    if (!currentAccount) {
      return;
    }
    try {
      if (isElectron) {
        const copied = await electronAPI.copyToClipboard(currentAccount);
        if (!copied) {
          throw new Error('copy-to-clipboard-failed');
        }
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentAccount);
      } else {
        throw new Error('clipboard-api-unavailable');
      }
      if (walletActionStatus) {
        walletActionStatus.textContent = '地址已复制到剪贴板。';
      }
    } catch (error) {
      console.error(error);
      if (walletActionStatus) {
        walletActionStatus.textContent = '复制失败，请手动复制地址。';
      }
    }
  });
}

if (walletResetBtn) {
  walletResetBtn.addEventListener('click', () => {
    setWalletDisconnected('已清除连接状态', '点击连接按钮重新授权。');
  });
}

if (walletExplorerLink) {
  walletExplorerLink.addEventListener('click', (event) => {
    if (walletExplorerLink.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      return;
    }
    if (isElectron) {
      event.preventDefault();
      electronAPI.openExternal(walletExplorerLink.href);
    }
  });
}

initialize();
