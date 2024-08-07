export const fetchArticles = async () => {
  const response = await fetch('https://scoops-finder.s3.us-east-2.amazonaws.com/PAIN.json');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  const data = await response.json();
  console.log('Fetched data:', data); // Log the fetched data
  return data;
};