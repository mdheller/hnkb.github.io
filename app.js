const loadingElement = document.getElementById('loading')
const storyTitleElement = document.getElementById('story-title')
const URL = document.getElementById('story-url')
const TEXT = document.getElementById('story-text')

const getStory = async (storyID) => {  
  const story = await fetch(`https://hacker-news.firebaseio.com/v0/item/${storyID}.json?print=pretty`)
    .then((response) => {
      return response.json();
    })
    .then((data) => {      
      return data;
    });

  return story;
}



const buildCommentHTML = (commentObject) => {
  let author = commentObject.by;
  let text = commentObject.text;  

  // Validation
  if (!commentObject) return false;
  if (commentObject.deleted === true) return false;

  // create div
  const parent = document.createElement('div');
  // div.classList.add('story-comment');
  
  // create author p
  const child1 = document.createElement('p');
  child1.classList.add('comment-author')
  child1.innerText = author;
  
  // create author text
  const child2 = document.createElement('div');
  child2.innerHTML = text;

  // TODO: Fix first childnode of comment (it's always an invalid text string)
  
  parent.appendChild(child1)
  parent.appendChild(child2)
    
  return parent;
}






const renderComments = async (commentsArray, elementId = null) => {    
  const isNested = elementId ? true : false;
  const COMMENT_PARENT = document.getElementById('story-comments');
  const PARENT = elementId ? document.getElementById(elementId) : COMMENT_PARENT;  

  // Remove comments if incoming array is empty.
  if (commentsArray.length === 0) {    
    COMMENT_PARENT.innerHTML = '';
    return;
  }
  if (!PARENT) return;
  




  let comments = await Promise.all(
    commentsArray.map(async commentID => {
      let commentsResponse = await getStory(commentID)
      return commentsResponse;
    })
  )


  
  // Handle HTML 
  comments.forEach((comment) => {
    // Validation
    if (!comment) return;
    if (comment.deleted === true) return;
    
    // Create the list item
    const LIST_ITEM = document.createElement('li');
    
    // Styling
    LIST_ITEM.classList.add('story-comment');
    // Set list item content:
    LIST_ITEM.id = comment.id; 
    
    // Build List Item content
    const COMMENT_CONTENT = buildCommentHTML(comment)
    LIST_ITEM.appendChild(COMMENT_CONTENT);

    // If nested, create another <ul> and put the comment in there.
    if (isNested) {
      const LIST = document.createElement('ul');
      LIST.classList.add('list-comment');

      PARENT.appendChild(LIST);
      LIST.appendChild(LIST_ITEM)
    }  else {
      // Append list items to ul
      PARENT.appendChild(LIST_ITEM);
    }

    if (comment.kids) {
      // Recursion
      renderComments(comment.kids, comment.id)
    }
  })
}


const renderCurrentStory = async (storyArray) => {
  const currentStoryIndex = localStorage.getItem('currentStoryIndex');
  const currentStoryID = storyArray[currentStoryIndex]
  const story = await getStory(currentStoryID)  

  let hasText = story.text === undefined ? false : true;
  let hasComments = story.kids && story.kids.length >= 1 ? true : false;
  let content = hasText ? story.text : story.url
  
  // Set title html
  storyTitleElement.innerHTML = story.title;

  if (hasText) {
    URL.classList.add('hide')
    URL.innerHTML = '';
    URL.href = "";

    TEXT.innerHTML = content;
    TEXT.classList.remove('hide')    
  } else {
    TEXT.classList.add('hide')
    TEXT.innerHTML = '';

    URL.innerHTML = content;
    URL.href = content;
    URL.classList.remove('hide')
    URL.focus();
  }

  if (hasComments) {  
    localStorage.setItem('currentStoryComments', story.kids)
  }
}


const attachEventListeners = (storiesArray) => {
  const stories = storiesArray;

  document.onkeydown = (e) => {
    let totalStoryIndex = localStorage.getItem('topStoriesLength');
    let currentStoryIndex = localStorage.getItem('currentStoryIndex');
    let currentStoryComments = localStorage.getItem('currentStoryComments');
    let commentsAreRenderedFlag = localStorage.getItem('commentsAreRenderedFlag');
    
    // LEFT
    if (e.keyCode == '37') {
      if (currentStoryIndex < 1) {        
        return;
      }
      
      let newIndex = Number(currentStoryIndex) - 1
      localStorage.setItem('currentStoryIndex', newIndex);
      localStorage.removeItem('currentStoryComments');
      localStorage.removeItem('commentsAreRenderedFlag');
      
      renderCurrentStory(stories);
      renderComments([]);
    }
    
    
    // RIGHT
    else if (e.keyCode == '39') {
      if (currentStoryIndex >= totalStoryIndex - 1) {        
        return;
      }

      let newIndex = Number(currentStoryIndex) + 1
      localStorage.removeItem('currentStoryComments');
      localStorage.removeItem('commentsAreRenderedFlag');
      localStorage.setItem('currentStoryIndex', newIndex);
            
      renderCurrentStory(stories);
      renderComments([]);
    }


    // DOWN (render comments)
    else if (e.keyCode == '40' && currentStoryComments && !commentsAreRenderedFlag) {
      const commentsArray = currentStoryComments.split(',')
      
      renderComments(commentsArray);

      localStorage.setItem('commentsAreRenderedFlag', true);
    }
  };
}



const getTopStories = async (storyID) => {  
  const stories = await fetch(`https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty`)
  .then((response) => {
    return response.json();
  })
  .then((data) => {   
    const currentStoryIndex = localStorage.getItem('currentStoryIndex');

    // If no index set, set to zero.
    if (!currentStoryIndex) {
      localStorage.setItem('currentStoryIndex', 0) 
    }
    
    // Save data
    localStorage.setItem('topStoriesLength', data.length);
    localStorage.setItem('topStories', data);
    
    return data;
  });
  
  return stories;
}



(async function() { 
  localStorage.removeItem('commentsAreRenderedFlag');

  const storiesArray = await getTopStories()
  await renderCurrentStory(storiesArray)
  const action = attachEventListeners(storiesArray)  
})();