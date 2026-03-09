import axios from 'axios';

async function test() {
  try {
    const response = await axios.get('http://localhost:3000/api/standings');
    console.log(response.data);
  } catch (e) {
    console.error(e);
  }
}
test();
