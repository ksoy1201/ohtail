import './styles/reset.css';
import './styles/style.css';

import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Header from './layouts/Header';
import Footer from './layouts/Footer';
import Main from './pages/main/Main';
import MyRecipeList from './pages/myRecipe/MyRecipeList';
import RecipeDetail from './pages/recipe/RecipeDetail';
import CreateMyRecipe from './pages/myRecipe/CreateMyRecipe';
import Webzine from './pages/webzine/Webzine';
import WebzineDetail from './pages/webzine/WebzineDetail';
import WebzineWrite from './pages/webzine/WebzineWrite';
import WebzineEdit from './pages/webzine/WebzineEdit';
import Login from './pages/login/Login';
import Signup from './pages/signup/Signup';
import Feed from './pages/feed/Feed';
import RecipeListPage from './pages/recipe/RecipeListPage';
import MyRecipeDetail from './pages/myRecipe/MyRecipeDetail';
import CreateFeed from './pages/feed/CreateFeed';
import EditMyRecipe from './pages/myRecipe/EditMyRecipe';
import Chatbot from './components/chatbot/Chatbot';
import FeedDetailPage from './pages/feed/FeedDetailPage';

function App() {
  return (
    <BrowserRouter>
      <div className="wrap">
        <Header />
        <Routes>
          <Route path="/" element={<Main />} />
          {/* 레시피 페이지 */}
          <Route path="/recipe" element={<RecipeListPage />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          {/* 마이 레시피 */}
          <Route path="/myRecipe" element={<MyRecipeList />} />
          <Route path="/myRecipe/:id" element={<MyRecipeDetail />} />
          <Route path="/createMyRecipe" element={<CreateMyRecipe />} />
          <Route path="/editMyRecipe/:id" element={<EditMyRecipe />} />
          {/* 웹진 */}
          <Route path="/webzine" element={<Webzine />} />
          <Route path="/webzineDetail/:webzineId" element={<WebzineDetail />} />
          <Route path="/webzineWrite" element={<WebzineWrite />} />
          <Route path="/webzineEdit" element={<WebzineEdit />} />
          {/* 로그인, 회원가입 */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* 피드 */}
          <Route path="/feed" element={<Feed />} />
          <Route path="/feed/:id" element={<FeedDetailPage />} />
          <Route path="/createFeed" element={<CreateFeed />} />
        </Routes>
        <Chatbot />
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
