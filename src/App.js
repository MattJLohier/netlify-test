import React, { useEffect, useState } from 'react';
import netlifyIdentity from './netlifyIdentity';
import { fetchArticles } from './fetchArticles';

function App() {
  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);

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
      const articles = await fetchArticles();
      setArticles(articles);
    };

    loadArticles();
  }, []);

  const saveArticle = (article) => {
    setSavedArticles([...savedArticles, article]);
  };

  return (
    <div className="App">
      <button onClick={() => netlifyIdentity.open()}>Log In</button>
      {user && <div>Welcome, {user.user_metadata.full_name}</div>}
      <div>
        <h1>Articles</h1>
        {articles.map((article, index) => (
          <div key={index}>
            <h2>{article.title}</h2>
            <p>{article.content}</p>
            <button onClick={() => saveArticle(article)}>Save</button>
          </div>
        ))}
      </div>
      <div>
        <h1>Saved Articles</h1>
        {savedArticles.map((article, index) => (
          <div key={index}>
            <h2>{article.title}</h2>
            <p>{article.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
