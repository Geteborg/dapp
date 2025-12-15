'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../contract';
import './globals.css';

const MEMES = [
  '/memes/meme1.jpg',
  '/memes/meme2.jpg',
  '/memes/meme3.jpg',
  '/memes/meme4.jpg',
  '/memes/meme5.jpg',
  '/memes/meme6.jpg',
  '/memes/meme7.jpg',
  '/memes/meme8.jpg',
  '/memes/meme9.jpg',
  '/memes/meme10.jpg',
  '/memes/meme11.jpg',
  '/memes/meme12.jpg',
  '/memes/meme13.jpg',
  '/memes/meme14.jpg',
  '/memes/meme15.jpg',
  '/memes/meme16.jpg',
  '/memes/meme17.jpg',
  '/memes/meme18.jpg',
  '/memes/meme19.jpg'

];

export default function Home() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [stats, setStats] = useState({
    totalDonations: '0',
    donationsCount: 0,
    balance: '0',
    myDonation: '0',
    owner: ''
  });
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showMeme, setShowMeme] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window.ethereum === 'undefined') {
      console.log('MetaMask не установлен');
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Пожалуйста, установите MetaMask!');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      setLoading(true);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await loadBlockchainData();
    } catch (error) {
      console.error("Ошибка подключения кошелька:", error);
      alert('Не удалось подключить кошелек');
    } finally {
      setLoading(false);
    }
  };

  const loadBlockchainData = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      setContract(contractInstance);
      setAccount(address);

      await loadStats(contractInstance, address);
      await loadMessages(contractInstance);

      contractInstance.on("DonationReceived", () => {
        loadStats(contractInstance, address);
        loadMessages(contractInstance);
      });

      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          loadBlockchainData();
        } else {
          setAccount('');
          setContract(null);
          setMessages([]);
        }
      });
    } catch (error) {
      console.error("Ошибка загрузки данных блокчейна:", error);
    }
  };

  const loadStats = async (contractInstance, userAddress) => {
    try {
      const totalDonations = await contractInstance.totalDonations();
      const donationsCount = await contractInstance.donationsCount();
      const balance = await contractInstance.getBalance();
      const myDonation = await contractInstance.getDonation(userAddress);
      const owner = await contractInstance.owner();

      setStats({
        totalDonations: ethers.formatEther(totalDonations),
        donationsCount: Number(donationsCount),
        balance: ethers.formatEther(balance),
        myDonation: ethers.formatEther(myDonation),
        owner: owner
      });
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
    }
  };

  const loadMessages = async (contractInstance) => {
    try {
      const recentMessages = await contractInstance.getRecentMessages(50);
      const formattedMessages = recentMessages.map(msg => ({
        donor: msg.donor,
        amount: ethers.formatEther(msg.amount),
        message: msg.message,
        timestamp: Number(msg.timestamp)
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Ошибка загрузки сообщений:", error);
    }
  };

  const donate = async () => {
    if (!contract || !amount) {
      alert('Пожалуйста, укажите сумму');
      return;
    }

    try {
      setLoading(true);
      const amountWei = ethers.parseEther(amount);
      const donationMessage = message || 'Анонимный донат';

      const tx = await contract.donate(donationMessage, { value: amountWei });
      await tx.wait();
      
      // Показываем случайный мем
      const randomMeme = MEMES[Math.floor(Math.random() * MEMES.length)];
      setShowMeme(randomMeme);

      await loadStats(contract, account);
      await loadMessages(contract);
      
      setAmount('');
      setMessage('');
    } catch (error) {
      console.error("Ошибка доната:", error);
      alert('❌ Ошибка доната: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.withdraw();
      await tx.wait();
      
      alert('✅ Средства успешно выведены!');
      await loadStats(contract, account);
    } catch (error) {
      console.error("Ошибка вывода:", error);
      alert('❌ Ошибка вывода: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwner = account && stats.owner && 
    account.toLowerCase() === stats.owner.toLowerCase();

  if (!account) {
    return (
      <div className="app-container">
        <h1 className="app-title">💝 Донат dApp</h1>
        <p className="app-subtitle">
          Поддержите нас криптовалютой и получите благодарственный мем!
        </p>
        <div className="donation-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <button onClick={connectWallet} className="connect-button" disabled={loading}>
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Подключение...
              </>
            ) : (
              '🦊 Подключить MetaMask'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <h1 className="app-title">💝 Donate dApp</h1>
      <p className="app-subtitle">
        Вы нам денежку - мы вам смешнявку 🎉
      </p>

      <div className="main-content">
        {}
        <div className="donation-card">
          <div className="wallet-info">
            Подключен: {account.substring(0, 6)}...{account.substring(38)}
            {isOwner && <div style={{marginTop: '5px', color: '#ffd700'}}>👑 Вы владелец контракта</div>}
          </div>

          <div className="stats-container">
            <div className="stat-box">
              <div className="stat-label">Всего собрано</div>
              <div className="stat-value">{parseFloat(stats.totalDonations).toFixed(4)} ETH</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Донатов</div>
              <div className="stat-value">{stats.donationsCount}</div>
            </div>
          </div>

          <div className="donation-form">
            <input
              type="number"
              step="0.001"
              placeholder="Введите сумму в ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="amount-input"
              disabled={loading}
            />

            <div className="quick-amounts">
              <button 
                className="quick-amount-btn" 
                onClick={() => setAmount('0.001')}
                disabled={loading}
              >
                0.001 ETH
              </button>
              <button 
                className="quick-amount-btn" 
                onClick={() => setAmount('0.01')}
                disabled={loading}
              >
                0.01 ETH
              </button>
              <button 
                className="quick-amount-btn" 
                onClick={() => setAmount('0.1')}
                disabled={loading}
              >
                0.1 ETH
              </button>
            </div>

            <textarea
              placeholder="Ваше сообщение (необязательно)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="message-input"
              disabled={loading}
              maxLength={200}
            />

            <button 
              onClick={donate} 
              className="donate-button"
              disabled={loading || !amount}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Обработка...
                </>
              ) : (
                '💖 Отправить донат'
              )}
            </button>
          </div>

          {parseFloat(stats.myDonation) > 0 && (
            <div className="my-donation">
              <strong>Ваши донаты:</strong> {parseFloat(stats.myDonation).toFixed(4)} ETH
            </div>
          )}

          {isOwner && parseFloat(stats.balance) > 0 && (
            <button 
              onClick={withdraw} 
              className="withdraw-button"
              disabled={loading}
            >
              {loading ? 'Вывод...' : `💰 Вывести ${parseFloat(stats.balance).toFixed(4)} ETH`}
            </button>
          )}
        </div>

        {}
        <div className="messages-card">
          <h2 className="messages-header">💬 История донатов</h2>
          
          {messages.length === 0 ? (
            <div className="no-messages">
              Пока нет донатов. Будьте первым! 🚀
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, index) => (
                <div key={index} className="message-item">
                  <div className="message-header">
                    <span className="message-donor">
                      {msg.donor.substring(0, 6)}...{msg.donor.substring(38)}
                    </span>
                    <span className="message-amount">
                      {parseFloat(msg.amount).toFixed(4)} ETH
                    </span>
                  </div>
                  <div className="message-text">
                    {msg.message || 'Анонимный донат'}
                  </div>
                  <div className="message-time">
                    {formatDate(msg.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {}
      {showMeme && (
        <div className="meme-overlay">
          <div className="meme-container">
            <h2 className="meme-title">🎉 Спасибо за ваш донат! 🎉</h2>
            <img src={showMeme} alt="Благодарственный мем" className="meme-image" />
            <button 
              onClick={() => setShowMeme(null)} 
              className="close-meme-button"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
