document.addEventListener('DOMContentLoaded', () => {
    const createPostForm = document.getElementById('create-post-form');
    const postsContainer = document.getElementById('posts-container');
  
    createPostForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(createPostForm);
      const title = formData.get('title');
      const content = formData.get('content');
  
      try {
        const response = await fetch('/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ title, content })
        });
        const newPost = await response.json();
        console.log('New post created:', newPost);
        // Optionally, update the UI to display the new post
      } catch (error) {
        console.error('Error creating post:', error);
      }
    });
  
    // Function to fetch and display posts
    async function fetchPosts() {
      try {
        const response = await fetch('/posts', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const posts = await response.json();
        console.log('Posts:', posts);
        // Update the UI to display the posts
        postsContainer.innerHTML = '';
        posts.forEach(post => {
          const postElement = document.createElement('div');
          postElement.innerHTML = `
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <button onclick="deletePost(${post.id})">Delete</button>
          `;
          postsContainer.appendChild(postElement);
        });
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    }
  
    fetchPosts(); // Fetch and display posts when the page loads
  });
  
  // Function to delete a post
  async function deletePost(postId) {
    try {
      const response = await fetch(`/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        console.log('Post deleted successfully');
        // Optionally, update the UI to remove the deleted post
      } else {
        console.error('Failed to delete post:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  }
  