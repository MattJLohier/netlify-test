import React, { useEffect, useState } from 'react';
import netlifyIdentity from './netlifyIdentity';
import { fetchArticles } from './fetchArticles';

function App() {
  const [user, setUser] = useState(null);
  const [articleGroups, setArticleGroups] = useState([]);
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
      try {
        const data = await fetchArticles();
        setArticleGroups(data);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
      }
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
        {articleGroups.map((group, index) => (
          <div key={index}>
            <h2>{group.group_title}</h2>
            {group.articles.map((article, idx) => (
              <div key={idx}>
                <h3>{article.title}</h3>
                <p>{article.description}</p>
                <p><strong>Date:</strong> {article.date}</p>
                <p><strong>Source:</strong> {article.source_name}</p>
                {article.link !== 'NA' && <a href={article.link}>Read more</a>}
                <button onClick={() => saveArticle(article)}>Save</button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div>
        <h1>Saved Articles</h1>
        {savedArticles.map((article, index) => (
          <div key={index}>
            <h3>{article.title}</h3>
            <p>{article.description}</p>
            <p><strong>Date:</strong> {article.date}</p>
            <p><strong>Source:</strong> {article.source_name}</p>
            {article.link !== 'NA' && <a href={article.link}>Read more</a>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;