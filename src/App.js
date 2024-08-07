import React, { useEffect, useState } from 'react';
import netlifyIdentity from './netlifyIdentity';
import { fetchArticles } from './fetchArticles';
import './App.css';
import logo from './images/logo.png'; // Make sure to add your logo image in the same directory

function App() {
  const [user, setUser] = useState(null);
  const [articleGroups, setArticleGroups] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);
  const [activeTab, setActiveTab] = useState('articles');

  useEffect(() => {
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

  const saveOrUnsaveArticle = (article) => {
    if (savedArticles.some(saved => saved.title === article.title)) {
      setSavedArticles(savedArticles.filter(saved => saved.title !== article.title));
    } else {
      setSavedArticles([...savedArticles, article]);
    }
  };

  return (
    <div className="App">
      <div className="sidebar">
        <img src={logo} alt="Logo" className="logo" />
        {user && <div className="user-info">Welcome, {user.user_metadata.full_name}</div>}
        <button className="login-button" onClick={() => netlifyIdentity.open()}>Log In</button>
      </div>
      <div className="main-content">
        <div className="nav">
          <button className={activeTab === 'articles' ? 'active' : ''} onClick={() => setActiveTab('articles')}>Articles</button>
          <button className={activeTab === 'saved' ? 'active' : ''} onClick={() => setActiveTab('saved')}>Saved</button>
        </div>

        <div className="content">
          {activeTab === 'articles' && (
            <div>
              <h1>Articles</h1>
              {articleGroups.map((group, index) => (
                <div key={index} className="article-group">
                  <h2>{group.group_title}</h2>
                  {group.articles.map((article, idx) => (
                    <div key={idx} className="article">
                      <h3>{article.title}</h3>
                      <p>{article.description}</p>
                      <p><strong>Date:</strong> {article.date}</p>
                      <p><strong>Source:</strong> {article.source_name}</p>
                      {article.link !== 'NA' && <a className="article-link" href={article.link} target="_blank" rel="noopener noreferrer">Read more</a>}
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
                    <h3>{article.title}</h3>
                    <p>{article.description}</p>
                    <p><strong>Date:</strong> {article.date}</p>
                    <p><strong>Source:</strong> {article.source_name}</p>
                    {article.link !== 'NA' && <a className="article-link" href={article.link} target="_blank" rel="noopener noreferrer">Read more</a>}
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
        </div>
      </div>
    </div>
  );
}

export default App;
