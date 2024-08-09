import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import netlifyIdentity from 'netlify-identity-widget';
import { fetchArticles } from './fetchArticles';
import './App.css';
import logo from './images/logo.png'; 
import LoginScreen from './LoginScreen'; 

function App() {
  const [user, setUser] = useState(null);
  const [articleGroups, setArticleGroups] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);
  const [activeTab, setActiveTab] = useState('articles');
  const [summarizedArticle, setSummarizedArticle] = useState('');
  const [articleValidity, setArticleValidity] = useState({});
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    const currentUser = netlifyIdentity.currentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    netlifyIdentity.on('login', (user) => setUser(user));
    netlifyIdentity.on('logout', () => setUser(null));

    return () => {
      netlifyIdentity.off('login');
      netlifyIdentity.off('logout');
    };
  }, []);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const data = await fetchArticles();
        setArticleGroups(data);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      }
    };

    loadArticles();
  }, []);

  const checkArticleValidity = useCallback(async () => {
    setLoading(true);
    const validity = {};

    for (const article of savedArticles) {
      const articleUrl = getSourceLink(article);

      console.log('Checking validity for article:', article);

      try {
        const payload = {
          url: articleUrl,
          action: 'check',
        };

        console.log('Sending payload for validity check:', payload);

        const response = await axios.post('/.netlify/functions/summarize', payload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('Response data for article:', article.title, response.data);
        validity[article.title] = response.data.reason || '✅ URL is Valid';
      } catch (error) {
        console.error('Error checking validity for article:', article.title, error);
        validity[article.title] = '❌URL failed to Fetch';
      }
    }

    setArticleValidity(validity);
    setLoading(false);
  }, [savedArticles]);

  useEffect(() => {
    if (activeTab === 'summarize') {
      checkArticleValidity();
    }
  }, [activeTab, checkArticleValidity]);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      document.getElementById('scrollProgressBar').style.width = scrolled + '%';
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const saveOrUnsaveArticle = (article) => {
    if (savedArticles.some(saved => saved.title === article.title)) {
      setSavedArticles(savedArticles.filter(saved => saved.title !== article.title));
    } else {
      setSavedArticles([...savedArticles, article]);
    }
  };

  const handleLogout = () => {
    netlifyIdentity.logout();
  };

  const handleSummarize = async (article) => {
    const articleUrl = getSourceLink(article);

    const validityReason = articleValidity[article.title];
    if (articleUrl === 'NA' || validityReason !== '✅ URL is Valid') {
      console.error('Invalid URL or article is not valid for summarizing:', validityReason);
      return;
    }

    setSummaryLoading(true);

    const payload = {
      url: articleUrl,
      action: 'summarize',
    };

    console.log('Sending payload:', payload);

    try {
      const response = await axios.post('/.netlify/functions/summarize', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        setSummarizedArticle(response.data.summary);
      } else {
        console.error('Failed to summarize the article:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to summarize the article:', error);
    }

    setSummaryLoading(false);
  };

  const getSourceLink = (article) => {
    return article.sourceLink || article.source_link || 'NA';
  };

  const getSourceName = (article) => {
    return article.sourceName || article.source_name || 'Unknown Source';
  };

  const getCategoryBadgeClass = (category) => {
    return `category-badge category-${category.toLowerCase().replace(/\s+/g, '-')}`;
  };

  const getFlagIcon = (category) => {
    if (category.includes('JP')) {
      return '/jp-flag.svg';
    } else if (category.includes('US')) {
      return '/us-flag.svg';
    } else if (category.includes('EU')) {
      return '/eu-flag.svg';
    } else {
      return null;
    }
  };

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="App">
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
      <div className="sidebar">
        <img src={logo} alt="Logo" className="logo" />
        {user && (
          <div className="user-info">
            Welcome, {user.user_metadata.full_name}
            <br />
            <button className="logout-button" onClick={handleLogout}>Log Out</button>
          </div>
        )}
      </div>
      <div className={`main-content ${loading ? 'loading' : ''}`}>
        <div className="nav">
          {/* Move the scroll-progress-container here */}
          <div className="scroll-progress-container">
            <div id="scrollProgressBar" className="scroll-progress-bar"></div>
          </div>
          <button className={activeTab === 'articles' ? 'active' : ''} onClick={() => setActiveTab('articles')}>Articles</button>
          <button className={activeTab === 'saved' ? 'active' : ''} onClick={() => setActiveTab('saved')}>Saved</button>
          <button className={activeTab === 'summarize' ? 'active' : ''} onClick={() => setActiveTab('summarize')}>Summarize</button>
        </div>

        <div className="content">
          {activeTab === 'articles' && (
            <div>
              <h1>Latest Articles</h1>
              {articleGroups.map((group, index) => (
                <div key={index} className="article-group">
                  <h2>{group.group_title}</h2>
                  {group.articles.map((article, idx) => (
                    <div key={idx} className="article">
                      <div className="article-header">
                        <h3>{article.title}</h3>
                        <div className="article-header-right">
                          <div className={getCategoryBadgeClass(article.category)}>{article.category}</div>
                          {getFlagIcon(article.category) && (
                            <img
                              src={getFlagIcon(article.category)}
                              alt={`${article.category} flag`}
                              className="flag-icon"
                            />
                          )}
                        </div>
                      </div>
                      <p>{article.description}</p>
                      <p><strong>Date:</strong> {article.date}</p>
                      <p><strong>Source:</strong> {getSourceName(article)}</p>
                      {getSourceLink(article) !== 'NA' && (
                        <a className="article-link" href={getSourceLink(article)} target="_blank" rel="noopener noreferrer">Read more</a>
                      )}
                      <button
                        className={savedArticles.some(saved => saved.title === article.title) ? 'unsave-button' : 'save-button'}
                        onClick={() => saveOrUnsaveArticle(article)}
                      >
                        {savedArticles.some(saved => saved.title === article.title) ? 'Unsave' : 'Save'}
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {activeTab === 'saved' && (
            <div>
              <h1>Saved Articles</h1>
              {savedArticles.map((article, index) => (
                <div key={index} className="article-group">
                  <div className="article">
                    <div className="article-header">
                      <h3>{article.title}</h3>
                      <div className="article-header-right">
                        <div className={getCategoryBadgeClass(article.category)}>{article.category}</div>
                        {getFlagIcon(article.category) && (
                          <img
                            src={getFlagIcon(article.category)}
                            alt={`${article.category} flag`}
                            className="flag-icon"
                          />
                        )}
                      </div>
                    </div>
                    <p>{article.description}</p>
                    <p><strong>Date:</strong> {article.date}</p>
                    <p><strong>Source:</strong> {getSourceName(article)}</p>
                    {getSourceLink(article) !== 'NA' && (
                      <a className="article-link" href={getSourceLink(article)} target="_blank" rel="noopener noreferrer">Read more</a>
                    )}
                    <button
                      className="unsave-button"
                      onClick={() => saveOrUnsaveArticle(article)}
                    >
                      Unsave
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'summarize' && (
            <div>
              <h1>Summarize Articles</h1>
              <div className="summary-section">
                {summaryLoading ? (
                  <div className="summary-loading">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div>
                    <h2>Summary</h2>
                    {summarizedArticle ? (
                      <textarea
                      className="summary-textarea"
                      value={summarizedArticle}
                      onChange={(e) => setSummarizedArticle(e.target.value)}
                      rows="10"
                      cols="80"
                    />
                    ) : (
                      <p>Choose an Article to Summarize</p>
                    )}
                  </div>
                )}
              </div>
              {savedArticles.map((article, index) => (
                <div key={index} className="article-group">
                  <div className="article">
                    <div className="article-header">
                      <h3>{article.title}</h3>
                      <div className="article-header-right">
                        <div className={getCategoryBadgeClass(article.category)}>{article.category}</div>
                        {getFlagIcon(article.category) && (
                          <img
                            src={getFlagIcon(article.category)}
                            alt={`${article.category} flag`}
                            className="flag-icon"
                          />
                        )}
                      </div>
                    </div>
                    <p>{article.description}</p>
                    <p><strong>Date:</strong> {article.date}</p>
                    <p><strong>Source:</strong> {getSourceName(article)}</p>
                    {getSourceLink(article) !== 'NA' && (
                      <a className="article-link" href={getSourceLink(article)} target="_blank" rel="noopener noreferrer">Read more</a>
                    )}
                    <button
                      className="summarize-button"
                      onClick={() => handleSummarize(article)}
                      disabled={articleValidity[article.title] !== '✅ URL is Valid'}
                    >
                      {articleValidity[article.title] || 'Summarize'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
