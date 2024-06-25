require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./src/store/User');
const Counter = require('./src/store/Counter'); // Counter 모델 임포트
const MyRecipe = require('./src/store/MyRecipe');
const likeRoutes = require('./src/routes/likeRoutes');
const commentRoutes = require('./src/routes/commentRoutes');
const Feed = require('./src/store/Feed'); // Feed 모델 불러오기
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer'); // multer 임포트
const path = require('path');
const jwt = require('jsonwebtoken');
const OpenAIApi = require('openai'); // openai 임포트
const cookieParser = require('cookie-parser');
const fs = require('fs').promises; // fs 모듈 임포트

const app = express();
const port = 8080;

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

const corsOptions = {
    origin: 'http://localhost:3000',
    // 클라이언트의 주소
    credentials: true,
    // 인증 정보를 포함할 때 true로 설정
};

app.use(cors(corsOptions));
app.use(cookieParser());
mongoose
    .connect(
        'mongodb+srv://ohtail:wCvHp9yQNPDK7wOp@cluster0.yzwdj7o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
        {}
    )
    .then(() => console.log('MongoDB 연결 성공'))
    .catch((err) => console.error('MongoDB 연결 실패:', err));

// OpenAI API 설정
const openai = new OpenAIApi({
    apiKey: process.env.REACT_APP_CHATBOT_API_KEY,
});

// multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ dest: 'uploads/' });

const generateAccessToken = (userid) => {
    return jwt.sign({ userid }, 'your_secret_key', { expiresIn: '3h' });
};

app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // 정적 파일 제공 설정

app.use('/likes', likeRoutes);
app.use('/comments', commentRoutes);

const Webzine = require('./src/models/Webzine');

// 사용자 인증 미들웨어
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: '로그인이 필요합니다.' });
    }
    try {
        const decoded = jwt.verify(token.split(' ')[1], 'your_secret_key');
        req.user = decoded;
        console.log('Decoded token:', decoded);
        next();
    } catch (error) {
        console.error('토큰 인증 실패:', error);
        res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
};

// 회원가입
app.post('/signup', async (req, res) => {
    const { userid, password, email, phonenumber } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: '이미 존재하는 이메일입니다.' });
        }

        // 비밀번호 해싱
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('해싱된 비밀번호:', hashedPassword);

        // 유저 번호 증가
        const counter = await Counter.findByIdAndUpdate(
            { _id: 'userId' },
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true }
        );

        const newUser = new User({
            userid: counter.sequence_value,
            password: hashedPassword,
            email,
            phonenumber,
        });

        await newUser.save();

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({
            success: false,
            message: '회원가입 중 오류가 발생했습니다.',
            error: error.message,
        });
    }
});

// 로그인
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log('로그인 요청 받음:', { email, password }); // 요청 도착 확인용 로그

        const user = await User.findOne({ email });
        console.log('사용자 찾기 결과:', user); // 사용자 찾기 결과 로그

        if (!user) {
            console.log('사용자를 찾을 수 없습니다:', email);
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log('비밀번호 비교 결과:', passwordMatch); // 비밀번호 비교 결과 로그

        if (passwordMatch) {
            console.log('로그인 성공:', email);
            const token = generateAccessToken(user.userid);
            res.status(200).json({ message: '로그인 성공', token, userid: user.userid });
        } else {
            console.log('비밀번호가 일치하지 않습니다:', email);
            res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
        }
    } catch (error) {
        console.error('로그인 중 오류 발생:', error);
        res.status(500).json({ message: '로그인 중 오류가 발생했습니다.' });
    }
});

// 나만의 레시피 생성
app.post('/createMyRecipe', authenticateJWT, upload.array('files', 3), async (req, res) => {
    try {
        const { title, description, instructions } = req.body;
        const files = req.files.map((file) => file.path);
        const ingredients = [];
        const author = req.user.userid;

        for (let i = 0; req.body[`ingredient_${i}_name`]; i++) {
            ingredients.push({
                name: req.body[`ingredient_${i}_name`],
                quantity: req.body[`ingredient_${i}_quantity`],
                unit: req.body[`ingredient_${i}_unit`],
            });
        }

        const myRecipe = new MyRecipe({
            title,
            description,
            files,
            ingredients,
            instructions,
            author,
        });

        await myRecipe.save();
        res.status(201).json(myRecipe);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 나만의 레시피 리스트
app.get('/myRecipe', async (req, res) => {
    try {
        const recipes = await MyRecipe.find().sort({ createdAt: -1 });
        res.status(200).json(recipes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 나만의 레시피 상세
app.get('/myRecipe/:id', async (req, res) => {
    try {
        const myRecipe = await MyRecipe.findById(req.params.id);
        res.status(200).json(myRecipe);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 나만의 레시피 수정
app.put('/myRecipe/:id', authenticateJWT, upload.array('files', 3), async (req, res) => {
    try {
        const { title, description, instructions } = req.body;
        const newFiles = req.files.map((file) => file.path);
        const existingFiles = JSON.parse(req.body.existingFiles);
        const removedFiles = JSON.parse(req.body.removedFiles);
        const ingredients = [];

        for (let i = 0; req.body[`ingredient_${i}_name`]; i++) {
            ingredients.push({
                name: req.body[`ingredient_${i}_name`],
                quantity: req.body[`ingredient_${i}_quantity`],
                unit: req.body[`ingredient_${i}_unit`],
            });
        }

        // 기존 파일에서 삭제된 파일 제외
        const updatedFiles = existingFiles.filter((file) => !removedFiles.includes(file));
        const allFiles = [...updatedFiles, ...newFiles];

        const updatedRecipe = {
            title,
            description,
            files: allFiles,
            ingredients,
            instructions,
        };

        const result = await MyRecipe.findByIdAndUpdate(req.params.id, updatedRecipe, { new: true });

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 나만의 레시피 삭제
app.delete('/myRecipe/:id', authenticateJWT, async (req, res) => {
    try {
        await MyRecipe.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: '레시피가 삭제되었습니다.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// 챗봇 엔드포인트
app.post('/chatbot', async (req, res) => {
    const userPrompt = req.body.userPrompt;
    const roleBasedProppt = '당신은 고객님들을 위한 친절한 바텐더입니다.';
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: roleBasedProppt },
                { role: 'user', content: userPrompt },
            ],
            max_tokens: 100,
        });

        console.log(response.choices[0].message.content);
        res.send(response.choices[0].message.content);
    } catch (error) {
        console.error('OpenAI API 호출 오류:', error);
        res.status(500).json({ message: 'OpenAI API 호출 중 오류가 발생했습니다.' });
    }
});

// Webzine
app.get('/webzine', async (req, res) => {
    // 웹진 리스트 조회 10개만 갖고오기
    const webzineList = await Webzine.find().sort({ createdAt: -1 }).limit(10);
    res.json(webzineList);
});

// Webzine write
const webzineUpload = multer({
    dest: 'webzineUploads/',
});

app.post('/webzineWrite', webzineUpload.single('files'), authenticateJWT, async (req, res) => {
    console.log('webzineWrite 사용자 정보 확인: --- ', req.user);
    console.log('webzine test req.body: ', JSON.parse(JSON.stringify(req.body)));
    console.log('webzine test req.file: ', req.file);

    const { path, originalname } = req.file;
    const part = originalname.split('.');
    const ext = part[part.length - 1];
    const newPath = path + '.' + ext;

    fs.renameSync(path, newPath);

    const { title, content } = req.body;
    const webzineDoc = await Webzine.create({
        title,
        content,
        cover: newPath,
        author: req.user.userid,
        nickname: '오테일',
    });
    res.json(webzineDoc);
});

// Webzine list
app.get('/webzineList', async (req, res) => {
    console.log('요청');
    const webzineList = await Webzine.find().sort({ createdAt: -1 });
    res.json(webzineList);
    console.log(webzineList);
});

// Webzine detail
app.get('/webzineDetail/:id', async (req, res) => {
    const { id } = req.params;
    const webzineDoc = await Webzine.findById(id);
    res.json(webzineDoc);
});

// Webzine delete
app.delete('/delWebzine/:id', async (req, res) => {
  const { id } = req.params;
  await Webzine.findByIdAndDelete(id);
  res.json({ message: 'ok' });
});

// 피드 포스트 요청
app.post('/createFeed', authenticateJWT, upload.single('imgFile'), async (req, res) => {
    try {
        const { originalname } = req.file;
        const tempPath = req.file.path;
        const ext = path.extname(originalname);
        const newPath = tempPath + ext;

        // 파일명을 변경
        await fs.rename(tempPath, newPath);

        const { title, content } = req.body;
        const imageUrl = `http://localhost:8080/uploads/${path.basename(newPath)}`;
        console.log('생성된 이미지 URL:', imageUrl);
        console.log(req.file);
        console.log(req.body);

        const newFeed = new Feed({
            title,
            content,
            cover: imageUrl, // cover 필드에 이미지 URL 저장
        });

        await newFeed.save();

        console.log(req.body);
        console.log(req.file);
        res.status(200).json({ message: '피드가 성공적으로 생성되었습니다.' });
        res.status(201).json(newFeed);
    } catch (error) {
        console.error('피드 생성 중 오류 발생:', error);
        res.status(500).json({ message: '피드 생성 중 오류가 발생했습니다.' });
    }
});
app.get('/feedList', async (req, res) => {
    try {
        const feedList = await Feed.find().sort({ createdAt: -1 });
        res.json(feedList);
    } catch (error) {
        console.error('Error fetching feeds:', error);
        res.status(500).json({ message: 'Failed to fetch feeds' });
    }
});
app.get('/feedDetail/:id', async (req, res) => {
    const { id } = req.params;
    const feedDoc = await Feed.findById(id);
    res.json(feedDoc);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
