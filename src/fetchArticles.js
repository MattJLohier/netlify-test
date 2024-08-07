export const fetchArticles = async () => {
    const response = await fetch('https://scoops-finder.s3.us-east-2.amazonaws.com/PAIN.json');
    const data = await response.json();
    return data;
  };