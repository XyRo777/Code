// Sample data for the newsfeed with 5 posts
const posts = [
    {
        id: 1,
        user: "Admin",
        avatar: "AD",
        time: "2 hours ago",
        category: "announcement",
        content: "",
        image: "webDev.png",
        likes: 24,
        dislikes: 3,
        userReaction: null
    },
    {
        id: 2,
        user: "News Team",
        avatar: "NT",
        time: "5 hours ago",
        category: "news",
        content: "🚀 Big News in AI! DeepSeek Has Officially Launched! Say hello to the next giant leap in Artificial Intelligence.",
        image: "",
        likes: 15,
        dislikes: 1,
        userReaction: null
    },
    {
        id: 3,
        user: "Admin",
        avatar: "AD",
        time: "1 day ago",
        category: "announcement",
        content: "🚀 We're excited to announce that coding contests are coming soon to our platform! 🧑‍💻💡 Get ready to challenge yourself, compete with others, and sharpen your skills! 🏆🔥 Stay tuned! 👨‍💻👩‍💻 #CodingContest #ComingSoon",
        image: "",
        likes: 42,
        dislikes: 2,
        userReaction: null
    },
    {
        id: 4,
        user: "Admin",
        avatar: "AD",
        time: "2 days ago",
        category: "announcement",
        content: "🤖✨ Guess what? We’re cooking up something exciting — a Chat Bot is coming to our platform",
        image: "chatbot2.png",
        likes: 8,
        dislikes: 0,
        userReaction: null
    },
    {
        id: 5,
        user: "News Team",
        avatar: "NT",
        time: "3 days ago",
        category: "news",
        content: "🚀 The new GitHub version has officially launched! Go and Check out 💡",
        image: "Github.png",
        likes: 31,
        dislikes: 5,
        userReaction: null
    }
];

// DOM Elements
const newsfeedPosts = document.getElementById('newsfeedPosts');
const postContent = document.getElementById('postContent');
const fileUpload = document.getElementById('fileUpload');
const imagePreview = document.getElementById('imagePreview');
const removeImageBtn = document.getElementById('removeImageBtn');
const uploadStatus = document.getElementById('uploadStatus');
let selectedFile = null;

// Initialize the newsfeed
renderPosts(posts);

// Event Listeners
document.getElementById('postNewsButton').addEventListener('click', () => createPost('news'));
document.getElementById('postAnnouncementButton').addEventListener('click', () => createPost('announcement'));

fileUpload.addEventListener('change', handleFileUpload);
removeImageBtn.addEventListener('click', removeImage);

document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        const filter = this.dataset.filter;
        renderPosts(filter === 'all' ? posts : posts.filter(post => post.category === filter));
    });
});

// Functions
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
        uploadStatus.textContent = 'Please select an image file (JPEG, PNG, GIF)';
        uploadStatus.style.color = '#f72585';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        uploadStatus.textContent = 'Image must be smaller than 5MB';
        uploadStatus.style.color = '#f72585';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        imagePreview.src = event.target.result;
        imagePreview.style.display = 'block';
        removeImageBtn.style.display = 'inline-block';
        selectedFile = file;
        uploadStatus.textContent = 'Image ready for upload';
        uploadStatus.style.color = '#4895ef';
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    imagePreview.src = '';
    imagePreview.style.display = 'none';
    removeImageBtn.style.display = 'none';
    fileUpload.value = '';
    selectedFile = null;
    uploadStatus.textContent = '';
}

function createPost(category) {
    const content = postContent.value.trim();
    if (!content && !selectedFile) {
        alert('Please enter some text or select an image to post');
        return;
    }
    
    const newPost = {
        id: posts.length + 1,
        user: "You",
        avatar: "YO",
        time: "Just now",
        category: category,
        content: content,
        image: selectedFile ? URL.createObjectURL(selectedFile) : "",
        likes: 0,
        dislikes: 0,
        userReaction: null
    };
    
    posts.unshift(newPost);
    renderPosts(posts);
    resetForm();
}

function renderPosts(postsToRender) {
    if (postsToRender.length === 0) {
        newsfeedPosts.innerHTML = `
            <div class="empty-state">
                <i class="far fa-newspaper"></i>
                <h3>No posts found</h3>
                <p>There are no posts matching your filter</p>
            </div>
        `;
        return;
    }
    
    newsfeedPosts.innerHTML = postsToRender.map(post => `
        <div class="post">
            <div class="post-header">
                <div class="post-avatar">${post.avatar}</div>
                <div class="post-user-info">
                    <span class="post-user">${post.user}</span>
                    <div class="post-meta">
                        <span>${post.time}</span>
                        <span class="post-category ${post.category}">
                            <i class="fas ${post.category === 'news' ? 'fa-newspaper' : 'fa-bullhorn'}"></i>
                            ${post.category === 'news' ? 'News' : 'Announcement'}
                        </span>
                    </div>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            ${post.image ? `<img src="${post.image}" class="post-image" alt="Post image">` : ''}
            <div class="post-actions">
                <div class="post-action like-action ${post.userReaction === 'like' ? 'active' : ''}" data-post-id="${post.id}">
                    <i class="fas fa-thumbs-up"></i> ${post.likes}
                </div>
                <div class="post-action dislike-action ${post.userReaction === 'dislike' ? 'active' : ''}" data-post-id="${post.id}">
                    <i class="fas fa-thumbs-down"></i> ${post.dislikes}
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners to action buttons
    document.querySelectorAll('.like-action, .dislike-action').forEach(action => {
        action.addEventListener('click', handleReaction);
    });
}

function handleReaction() {
    const postId = parseInt(this.dataset.postId);
    const post = posts.find(p => p.id === postId);
    const isLike = this.classList.contains('like-action');
    
    // Update reaction counts
    if (post.userReaction === (isLike ? 'like' : 'dislike')) {
        // Remove reaction
        post[isLike ? 'likes' : 'dislikes']--;
        post.userReaction = null;
    } else {
        // Add new reaction
        if (post.userReaction) {
            // Remove previous reaction first
            post[post.userReaction === 'like' ? 'likes' : 'dislikes']--;
        }
        post[isLike ? 'likes' : 'dislikes']++;
        post.userReaction = isLike ? 'like' : 'dislike';
    }
    
    // Re-render with current filter
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    renderPosts(activeFilter === 'all' ? posts : posts.filter(p => p.category === activeFilter));
}

function resetForm() {
    postContent.value = '';
    removeImage();
}