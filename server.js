import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(express.static('README.mdpublic'));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/README.mdpublic/index.html');
});

app.listen(PORT, () => {
  console.log(`Quick Marketplace running on port ${PORT}`);
});
