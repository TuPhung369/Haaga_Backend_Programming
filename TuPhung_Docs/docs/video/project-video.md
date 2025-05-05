---
sidebar_position: 2
description: "Project Video"
hide_table_of_contents: true
---

import React, { useEffect, useState } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Head from '@docusaurus/Head';
import videoData from './videos.json';

export const VideoGallery = () => {
// Add state to track if videos are loaded
const [videosLoaded, setVideosLoaded] = useState(false);

// Add YouTube API and global styles
const YouTubeAPIScript = () => (

<Head>
<script src="https://www.youtube.com/iframe_api" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
<style>{`
/* Global container styles with high specificity - excluding footer */
html body .container.padding-top--md.padding-bottom--lg:not(.footer),
html body #__docusaurus .container.padding-top--md.padding-bottom--lg:not(.footer),
html body div.container.padding-top--md.padding-bottom--lg:not(.footer),
html body #__docusaurus div.container.padding-top--md.padding-bottom--lg:not(.footer),
html[data-theme] body .container.padding-top--md.padding-bottom--lg:not(.footer),
html[data-theme] body #__docusaurus .container.padding-top--md.padding-bottom--lg:not(.footer),
html[data-theme] body div.container.padding-top--md.padding-bottom--lg:not(.footer),
html[data-theme] body #__docusaurus div.container.padding-top--md.padding-bottom--lg:not(.footer),
.container.padding-top--md.padding-bottom--lg:not(.footer),
div.container.padding-top--md.padding-bottom--lg:not(.footer) {
  width: 100vw !important;
  max-width: 100vw !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  display: flex !important;
  justify-content: center !important;
  align-items: flex-start !important;
}

/_ Ensure footer is properly styled _/
.footer {
width: 100% !important;
max-width: 100% !important;
margin: 0 !important;
padding: 2rem 1rem !important;
box-sizing: border-box !important;
display: block !important;
}

/_ Additional container styles for all media queries - excluding footer _/
@media all {
.container:not(.footer),
div.container:not(.footer),
main.container:not(.footer),
.container.padding-top--md.padding-bottom--lg:not(.footer),
div.container.padding-top--md.padding-bottom--lg:not(.footer), #**docusaurus .container:not(.footer), #**docusaurus div.container:not(.footer) {
width: 100vw !important;
max-width: 100vw !important;
margin-left: 0 !important;
margin-right: 0 !important;
padding: 0 !important;
box-sizing: border-box !important;
}

/_ Ensure footer row is properly styled _/
.footer .row {
display: flex !important;
flex-wrap: wrap !important;
width: 100% !important;
margin: 0 !important;
justify-content: space-between !important;
}

/_ Ensure footer columns are properly styled _/
.footer .footer\_\_col {
flex: 1 0 200px !important;
margin-bottom: 1rem !important;
padding: 0 1rem !important;
}
}
`}</style>

</Head>
);

// Add a separate useEffect to ensure video list is rendered
useEffect(() => {
console.log('VideoGallery component mounted');

// Apply container styles immediately - excluding footer
const applyContainerStyles = () => {
console.log('Applying container styles immediately');
const containers = document.querySelectorAll('.container:not(.footer), [class*="container"]:not(.footer), div.container:not(.footer), main.container:not(.footer), .container.padding-top--md.padding-bottom--lg:not(.footer)');

containers.forEach(container => {
// Skip footer containers
if (container.classList.contains('footer') || container.closest('.footer')) {
console.log('Skipping footer container');
return;
}

// Apply all necessary styles with !important
container.style.setProperty('margin-left', '0', 'important');
container.style.setProperty('margin-right', '0', 'important');
container.style.setProperty('margin', '0', 'important');
container.style.setProperty('padding-left', '0', 'important');
container.style.setProperty('padding-right', '0', 'important');
container.style.setProperty('padding', '0', 'important');
container.style.setProperty('max-width', '100vw', 'important');
container.style.setProperty('width', '100vw', 'important');
container.style.setProperty('box-sizing', 'border-box', 'important');
});

// Also add a global style element - excluding footer
const styleEl = document.createElement('style');
styleEl.innerHTML =
"@media all {" +
" html body .container:not(.footer), " +
" html body div.container:not(.footer), " +
" html body main.container:not(.footer), " +
" html[data-theme] body .container:not(.footer), " +
" html[data-theme] body div.container:not(.footer), " +
" html[data-theme] body main.container:not(.footer), " +
" #**docusaurus .container:not(.footer), " +
" #**docusaurus div.container:not(.footer), " +
" #**docusaurus main.container:not(.footer) {" +
" width: 100vw !important;" +
" max-width: 100vw !important;" +
" margin-left: 0 !important;" +
" margin-right: 0 !important;" +
" padding: 0 !important;" +
" box-sizing: border-box !important;" +
" }" +
" .footer {" +
" width: 100% !important;" +
" max-width: 100% !important;" +
" margin: 0 !important;" +
" padding: 2rem 1rem !important;" +
" box-sizing: border-box !important;" +
" display: block !important;" +
" }" +
" .footer .row {" +
" display: flex !important;" +
" flex-wrap: wrap !important;" +
" width: 100% !important;" +
" margin: 0 !important;" +
" justify-content: space-between !important;" +
" }" +
" .footer .footer**col {" +
" flex: 1 0 200px !important;" +
" margin-bottom: 1rem !important;" +
" padding: 0 1rem !important;" +
" }" +
"}";
document.head.appendChild(styleEl);
};

// Run immediately and also after a short delay
applyContainerStyles();
setTimeout(applyContainerStyles, 500);
setTimeout(applyContainerStyles, 1000);
setTimeout(applyContainerStyles, 2000);

// Check if video data is available
if (videoData && videoData.videos) {
console.log('Video data is available:', videoData.videos.length);

    // Force render video items after a short delay
    setTimeout(() => {
      const videoItems = document.querySelectorAll('.video-item');
      if (videoItems.length === 0) {
        console.log('No video items found on mount, forcing render');
        renderVideoItems();
      } else {
        console.log('Video items already rendered:', videoItems.length);
      }
    }, 1000);

} else {
console.log('Video data is not available');
}
}, []);
useEffect(() => {
// Initialize variables
let player;
let videoItems = document.querySelectorAll('.video-item');
const currentVideoElement = document.getElementById('currentVideo');

// Function to ensure video items are loaded
const ensureVideoItemsLoaded = () => {
console.log('Checking if video items are loaded...');
videoItems = document.querySelectorAll('.video-item');
console.log('Found video items:', videoItems.length);

if (videoItems.length === 0) {
console.log('No video items found, will try again in 500ms');
// Force recreation of video list if it's missing
const videoList = document.getElementById('videoList');
if (videoList) {
console.log('Video list container exists but items are missing, forcing recreation');
// Force recreation of video items
renderVideoItems();
// Try again after a short delay
setTimeout(ensureVideoItemsLoaded, 500);
} else {
console.log('Video list container is missing, will try again');
setTimeout(ensureVideoItemsLoaded, 500);
}
} else {
console.log('Video items loaded, handling hash');
// Update state to indicate videos are loaded
setVideosLoaded(true);
// Delay a bit to make sure everything is ready
setTimeout(() => {
// Check if we have a hash in the URL
if (window.location.hash) {
console.log('Hash found in URL, handling it...');
handleHashChange();
} else {
console.log('No hash in URL, using default video');
}
}, 500);
}
};

// Function to manually render video items
const renderVideoItems = () => {
console.log('Manually rendering video items');
const videoList = document.getElementById('videoList');

if (videoList && videoData && videoData.videos) {
console.log('Found video list container and video data, rendering items');

    // Clear existing content
    videoList.innerHTML = '';

    // Create video items
    videoData.videos.forEach((video, index) => {
      // Use video ID directly
      const videoIdWithParams = video.id;

      // Create video item element
      const videoItem = document.createElement('div');
      videoItem.className = `video-item ${index === 0 ? 'active' : ''}`;
      videoItem.setAttribute('data-video-id', videoIdWithParams);
      videoItem.setAttribute('data-video-title', video.title);
      videoItem.setAttribute('data-video-description', video.description);

      // Create thumbnail
      const thumbnailDiv = document.createElement('div');
      thumbnailDiv.className = 'video-thumbnail';

      const thumbnailImg = document.createElement('img');
      thumbnailImg.src = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
      thumbnailImg.alt = `${video.title} Thumbnail`;
      thumbnailDiv.appendChild(thumbnailImg);

      // Removed timestamp overlay - not needed

      // Add duration overlay
      if (video.duration) {
        const durationOverlay = document.createElement('div');
        // Simple duration overlay
        durationOverlay.className = 'video-duration-overlay';
        durationOverlay.textContent = video.duration;
        thumbnailDiv.appendChild(durationOverlay);
      }

      // Create info div
      const infoDiv = document.createElement('div');
      infoDiv.className = 'video-info';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'video-timestamp';
      titleDiv.textContent = video.title;
      infoDiv.appendChild(titleDiv);

      // Add description
      const descriptionDiv = document.createElement('div');
      descriptionDiv.className = 'video-description';
      descriptionDiv.textContent = video.description;
      infoDiv.appendChild(descriptionDiv);

      // Duration is now displayed in the thumbnail overlay

      // Create share button
      const shareButton = document.createElement('button');
      shareButton.className = 'share-button';
      shareButton.title = 'Share this video';
      shareButton.innerHTML = '<i class="fas fa-share-alt"></i> Share';

      // Add elements to video item
      videoItem.appendChild(thumbnailDiv);
      videoItem.appendChild(infoDiv);
      videoItem.appendChild(shareButton);

      // Add video item to list
      videoList.appendChild(videoItem);
    });

    console.log('Finished rendering video items:', videoList.children.length);

} else {
console.log('Could not find video list container or video data');
}
};

// Call this function to ensure video items are loaded
setTimeout(ensureVideoItemsLoaded, 1000);

// Function to handle hash changes and select the appropriate video
const handleHashChange = () => {
// Check for hash in URL
if (!window.location.hash) {
console.log('No hash in URL');
return;
}

const hash = window.location.hash.substring(1);
console.log('Hash found in URL:', hash);

// Check if hash is a number (index)
const videoIndex = parseInt(hash, 10);
console.log('Parsed video index:', videoIndex);

if (!isNaN(videoIndex) && videoIndex >= 0 && videoIndex < videoItems.length) {
console.log('Using index to select video:', videoIndex);

// Get the video data directly from videoData
console.log('Video data available:', videoData.videos.length);

if (videoData.videos.length > videoIndex) {
const video = videoData.videos[videoIndex];
console.log('Selected video from data:', video);

    // Find the corresponding video item in the DOM
    const targetVideoItem = videoItems[videoIndex];

    if (targetVideoItem) {
      console.log('Found target video item in DOM');

      // Manually update the player with the correct video and timestamp
      if (player && player.loadVideoById) {
        console.log('Updating player directly');

        // Get video ID
        const videoId = video.id;

        console.log('Loading video ID:', videoId);

        // Load the video
        player.loadVideoById({
          'videoId': videoId,
          'startSeconds': 0,
          'suggestedQuality': 'hd1080'
        });

        // Update the active class on the video items
        videoItems.forEach(item => item.classList.remove('active'));
        targetVideoItem.classList.add('active');

        console.log('Video updated successfully');
        return;
      }
    }

}

// Fallback to the old method if direct update fails
console.log('Falling back to click method');
const targetVideoItem = videoItems[videoIndex];
if (targetVideoItem) {
console.log('Clicking on target video item');
targetVideoItem.click();
} else {
console.log('No target video item found for index:', videoIndex);
}
} else {
// Try to match by title for backward compatibility
console.log('Index not valid, trying to match by title');
const titleWords = hash.split('-');
let targetVideoItem = null;

// Find the video item with title containing the hash words
videoItems.forEach((item, idx) => {
const title = item.getAttribute('data-video-title').toLowerCase();
console.log(`Checking video ${idx}:`, title);
const matchesAllWords = titleWords.every(word => title.includes(word));

    if (matchesAllWords) {
      console.log('Found matching video by title:', title);
      targetVideoItem = item;
    }

});

// Click on the found video item to play it
if (targetVideoItem) {
console.log('Clicking on target video item');
targetVideoItem.click();
} else {
console.log('No target video item found for hash:', hash);
console.log('Available video items:', videoItems.length);
}
}
};

// Handle video selection from dropdown
const handleVideoSelected = (event) => {
const { index } = event.detail;
console.log('Video selected from dropdown:', index);

if (index >= 0 && index < videoItems.length) {
// Get the video data directly
if (videoData.videos.length > index) {
const video = videoData.videos[index];
console.log('Selected video from data:', video);

    // Manually update the player with the correct video and timestamp
    if (player && player.loadVideoById) {
      console.log('Updating player directly from dropdown event');

      // Get video ID
      const videoId = video.id;

      console.log('Loading video ID:', videoId);

      // Load the video
      player.loadVideoById({
        'videoId': videoId,
        'startSeconds': 0,
        'suggestedQuality': 'hd1080'
      });

      // Update the active class on the video items
      videoItems.forEach(item => item.classList.remove('active'));
      videoItems[index].classList.add('active');

      // Update URL hash
      window.history.replaceState(null, null, `#${index}`);

      console.log('Video updated successfully from dropdown');
      return;
    }

}

// Fallback to click method
console.log('Falling back to click method from dropdown');
videoItems[index].click();
} else {
console.log('Invalid video index from dropdown:', index);
}
};

// Listen for custom videoSelected event from the dropdown
document.addEventListener('videoSelected', handleVideoSelected);

// Note: We're now handling the hash in ensureVideoItemsLoaded function
// so we don't need this separate timeout anymore
// setTimeout(handleHashChange, 2000);

// Also try again after player is ready
const tryHandleHashAgain = () => {
console.log('Trying to handle hash again...');
if (window.location.hash) {
handleHashChange();
}
};

// Listen for hash changes
window.addEventListener('hashchange', function() {
console.log('Hash changed, handling it...');
handleHashChange();
});

    // Initialize YouTube player when API is ready
    if (typeof window !== 'undefined') {
      // Add YouTube API
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }

      // Setup YouTube player
      window.onYouTubeIframeAPIReady = function() {
        const playerContainer = document.getElementById('currentVideo');

        // Check if playerContainer exists to avoid errors
        if (!playerContainer) {
          console.log('Player container not found, retrying in 500ms');
          setTimeout(window.onYouTubeIframeAPIReady, 500);
          return;
        }

        const containerWidth = playerContainer.offsetWidth;
        const containerHeight = containerWidth * 0.5625; // 16:9 aspect ratio

        // Get first video ID from the JSON data
        const firstVideoId = videoData.videos[0].id;

        player = new window.YT.Player('currentVideo', {
          height: containerHeight,
          width: containerWidth,
          videoId: firstVideoId,
          playerVars: {
            'playsinline': 1,
            'rel': 0,
            'vq': 'hd1080',
            'controls': 1,
            'modestbranding': 1
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });
      };

      // When player is ready
      function onPlayerReady(event) {
        // Set quality to highest available
        event.target.setPlaybackQuality('hd1080');

        // Try to handle hash again after player is ready
        setTimeout(tryHandleHashAgain, 500);
      }

      // When player state changes
      function onPlayerStateChange(event) {
        // Set quality to highest available whenever state changes
        if (event.data === window.YT.PlayerState.BUFFERING ||
            event.data === window.YT.PlayerState.PLAYING) {
          event.target.setPlaybackQuality('hd1080');
        }
      }
    }

    // Handle video item clicks
    videoItems.forEach(item => {
      // Handle click on video item (not on share button)
      item.addEventListener('click', function(e) {
        // Don't trigger if share button was clicked
        if (e.target.closest('.share-button')) {
          return;
        }

        // Remove active class from all items
        videoItems.forEach(i => i.classList.remove('active'));

        // Add active class to clicked item
        this.classList.add('active');

        // Get video data
        const videoId = this.getAttribute('data-video-id');
        const videoTitle = this.getAttribute('data-video-title');
        const videoDescription = this.getAttribute('data-video-description');

        // Find the index of this video item
        let videoIndex = -1;
        videoItems.forEach((item, index) => {
          if (item === this) {
            videoIndex = index;
          }
        });

        // Update URL hash with the index
        if (videoIndex >= 0) {
          window.history.replaceState(null, null, `#${videoIndex}`);
        }

        // Update video if player is ready
        if (player && player.loadVideoById) {
          console.log('Updating video with ID:', videoId);

          // Extract the base video ID without parameters
          const baseVideoId = videoId.split('?')[0];
          console.log('Base video ID:', baseVideoId);

          console.log('Loading video with ID:', baseVideoId);
          player.loadVideoById({
            'videoId': baseVideoId,
            'startSeconds': 0,
            'suggestedQuality': 'hd1080'
          });
        } else if (currentVideoElement) {
          // Fallback if player isn't ready
          console.log('Player not ready, using fallback');
          currentVideoElement.src = `https://www.youtube.com/embed/${videoId}`;
        }

        // Scroll to top of video player on mobile
        if (window.innerWidth <= 1000) {
          document.getElementById('videoPlayer').scrollIntoView({ behavior: 'smooth' });
        }
      });

      // Handle share button clicks
      const shareButton = item.querySelector('.share-button');
      if (shareButton) {
        shareButton.addEventListener('click', function(e) {
          e.stopPropagation(); // Prevent video from playing

          const videoId = item.getAttribute('data-video-id');
          const videoTitle = item.getAttribute('data-video-title');
          const shareUrl = `https://www.youtube.com/watch?v=${videoId}`;

          // Try to use Web Share API if available
          if (navigator.share) {
            navigator.share({
              title: videoTitle,
              url: shareUrl
            }).catch(err => {
              console.error('Error sharing:', err);
              // Fallback to clipboard
              copyToClipboard(shareUrl);
            });
          } else {
            // Fallback to clipboard
            copyToClipboard(shareUrl);
          }
        });
      }
    });

    // Helper function to copy text to clipboard
    function copyToClipboard(text) {
      // Create temporary input
      const input = document.createElement('input');
      input.style.position = 'fixed';
      input.style.opacity = 0;
      input.value = text;
      document.body.appendChild(input);

      // Select and copy
      input.select();
      document.execCommand('copy');

      // Clean up
      document.body.removeChild(input);

      // Show feedback
      alert('Video URL copied to clipboard!');
    }

    // Cleanup function to remove event listeners when component unmounts
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      document.removeEventListener('videoSelected', handleVideoSelected);

      // Remove click event listeners from video items
      videoItems.forEach(item => {
        item.removeEventListener('click', function() {});
        const shareButton = item.querySelector('.share-button');
        if (shareButton) {
          shareButton.removeEventListener('click', function() {});
        }
      });
    };

}, []);

// Add a function to force the correct width after the page loads
useEffect(() => {
// Function to force the correct width
const forceCorrectWidth = () => {
// Get the window width
const windowWidth = window.innerWidth;

// Target the container with 273px margin - excluding footer
const containers = document.querySelectorAll('.container:not(.footer)');
containers.forEach(container => {
// Skip footer containers
if (container.classList.contains('footer') || container.closest('.footer')) {
console.log('Skipping footer container in margin check');
return;
}

const computedStyle = window.getComputedStyle(container);
const marginLeft = computedStyle.getPropertyValue('margin-left');
const marginRight = computedStyle.getPropertyValue('margin-right');

if (marginLeft === '273px' || marginRight === '273px') {
console.log('Found container with 273px margin in useEffect:', container.className);
container.style.setProperty('margin-left', '0', 'important');
container.style.setProperty('margin-right', '0', 'important');
container.style.setProperty('padding-left', '0', 'important');
container.style.setProperty('padding-right', '0', 'important');
container.style.setProperty('max-width', '100vw', 'important');
container.style.setProperty('width', '100vw', 'important');
}
});

    // Calculate the video player width (window width - video list width - padding)
    const videoPlayerWidth = windowWidth - 400 - 55; // 400px for video list, 55px for reduced padding and gap

    // Force the video player to take the correct width
    const videoPlayer = document.querySelector('.video-player');
    if (videoPlayer) {
      videoPlayer.style.width = `${videoPlayerWidth}px`;
      videoPlayer.style.minWidth = `${videoPlayerWidth}px`;
      videoPlayer.style.maxWidth = `${videoPlayerWidth}px`;
      videoPlayer.style.marginLeft = '0';
      videoPlayer.style.marginRight = 'auto';
      console.log('Set video player width to:', videoPlayerWidth);
    } else {
      console.log('Video player element not found');
    }

    // Force the video list to take the correct width
    const videoList = document.querySelector('.video-list');
    if (videoList) {
      videoList.style.width = '400px';
      videoList.style.minWidth = '400px';
      videoList.style.maxWidth = '400px';
      videoList.style.display = 'block';
      videoList.style.visibility = 'visible';
      videoList.style.opacity = '1';
      videoList.style.flex = '0 0 400px';
      console.log('Set video list width to: 400px');
    } else {
      console.log('Video list element not found');
    }

    // Also try to set the video container width
    const videoContainer = document.querySelector('.video-container');
    if (videoContainer) {
      videoContainer.style.width = '100%';
      videoContainer.style.maxWidth = '100%';
      videoContainer.style.justifyContent = 'flex-start';
      videoContainer.style.display = 'flex';
      videoContainer.style.flexDirection = 'row';
      videoContainer.style.flexWrap = 'nowrap';
      videoContainer.style.gap = '15px';
      videoContainer.style.marginLeft = '0';
      videoContainer.style.paddingLeft = '20px';
      console.log('Set video container width to 100%');
    } else {
      console.log('Video container element not found');
    }

};

// Run immediately and on resize
forceCorrectWidth();
window.addEventListener('resize', forceCorrectWidth);

// Run again after a short delay to ensure everything is loaded
setTimeout(forceCorrectWidth, 1000);

// Check if video list exists, if not, try to recreate it
setTimeout(() => {
const videoList = document.querySelector('.video-list');
if (!videoList) {
console.log('Video list still not found, trying to recreate it');
const videoContainer = document.querySelector('.video-container');
if (videoContainer) {
// Check if videoList div exists in the DOM but is not visible
const existingVideoList = document.getElementById('videoList');
if (existingVideoList) {
console.log('Video list exists but might not be visible, fixing styles');
existingVideoList.style.display = 'block';
existingVideoList.style.visibility = 'visible';
existingVideoList.style.opacity = '1';
existingVideoList.style.width = '400px';
existingVideoList.style.minWidth = '400px';
existingVideoList.style.maxWidth = '400px';
existingVideoList.style.flex = '0 0 400px';
}
}
}
}, 1500);

// Force render video items if they're not loaded
setTimeout(() => {
const videoItems = document.querySelectorAll('.video-item');
if (videoItems.length === 0) {
console.log('Video items still not loaded after delay, forcing render');
renderVideoItems();
}
}, 2000);

// Run multiple times to ensure it takes effect
const intervalId = setInterval(forceCorrectWidth, 2000);

// Function to remove margins from containers - excluding footer
const removeContainerMargins = () => {
// Target all containers except footer
const containers = document.querySelectorAll('.container:not(.footer), [class*="container"]:not(.footer)');
containers.forEach(container => {
// Skip footer containers
if (container.classList.contains('footer') || container.closest('.footer')) {
console.log('Skipping footer container in removeContainerMargins');
return;
}

// Apply to all non-footer containers
container.style.marginLeft = '0';
container.style.marginRight = '0';
container.style.paddingLeft = '0';
container.style.paddingRight = '0';
container.style.maxWidth = '100vw';
container.style.width = '100vw';

    // Log container classes for debugging
    console.log('Container class:', container.className);

});

// Target all columns
const columns = document.querySelectorAll('.col');
columns.forEach(column => {
if (column.className.includes('col--')) {
column.style.marginLeft = '0';
column.style.marginRight = '0';
column.style.paddingLeft = '0';
column.style.paddingRight = '0';
column.style.maxWidth = '100%';
column.style.flexBasis = '100%';
}
});

// Target the main article
const article = document.querySelector('article');
if (article) {
article.style.marginLeft = '0';
article.style.marginRight = '0';
article.style.paddingLeft = '0';
article.style.paddingRight = '0';
article.style.maxWidth = '100vw';
article.style.width = '100vw';
}
};

// Run the function immediately and periodically
removeContainerMargins();
const marginIntervalId = setInterval(removeContainerMargins, 1000);

// Clean up event listener and intervals on unmount
return () => {
window.removeEventListener('resize', forceCorrectWidth);
clearInterval(intervalId);
clearInterval(marginIntervalId);
};
}, []);

return (
<>
<YouTubeAPIScript />

  <div className="video-container" style={{display: 'flex', flexDirection: 'row', gap: '15px', width: '100vw', maxWidth: '100vw', position: 'relative', zIndex: 1, padding: '20px', marginLeft: 0, justifyContent: 'flex-start'}} id="videoMainContainer">
    <script dangerouslySetInnerHTML={{__html: `
      // Function to fix container margins
      function fixContainerMargins() {
        // Target the specific container with 273px margin
        const specificContainer = document.querySelector('.container.padding-top--md.padding-bottom--lg');
        if (specificContainer) {
          console.log('Found the specific container with 273px margin');
          specificContainer.style.setProperty('margin-left', '0', 'important');
          specificContainer.style.setProperty('margin-right', '0', 'important');
          specificContainer.style.setProperty('padding-left', '0', 'important');
          specificContainer.style.setProperty('padding-right', '0', 'important');
          specificContainer.style.setProperty('max-width', '100vw', 'important');
          specificContainer.style.setProperty('width', '100vw', 'important');
          
          // Check if the container still has auto margins
          const computedStyle = window.getComputedStyle(specificContainer);
          console.log('Container margin-left:', computedStyle.getPropertyValue('margin-left'));
          console.log('Container margin-right:', computedStyle.getPropertyValue('margin-right'));
          console.log('Container max-width:', computedStyle.getPropertyValue('max-width'));
          
          // If it still has auto margins, try a different approach
          if (computedStyle.getPropertyValue('margin-left') === 'auto' || 
              computedStyle.getPropertyValue('margin-right') === 'auto' ||
              computedStyle.getPropertyValue('max-width') === '1200px') {
            console.log('Container still has auto margins or max-width: 1200px, trying a different approach');
            
            // Create a style element to override the styles with extremely high specificity
            const styleEl = document.createElement('style');
            styleEl.innerHTML = 
              "html body .container.padding-top--md.padding-bottom--lg, " +
              "html body #__docusaurus .container.padding-top--md.padding-bottom--lg, " + 
              "html body div.container.padding-top--md.padding-bottom--lg, " + 
              "html body #__docusaurus div.container.padding-top--md.padding-bottom--lg, " +
              "html[data-theme] body .container.padding-top--md.padding-bottom--lg, " +
              "html[data-theme] body #__docusaurus .container.padding-top--md.padding-bottom--lg, " + 
              "html[data-theme] body div.container.padding-top--md.padding-bottom--lg, " + 
              "html[data-theme] body #__docusaurus div.container.padding-top--md.padding-bottom--lg, " +
              ".container.padding-top--md.padding-bottom--lg, " +
              "div.container.padding-top--md.padding-bottom--lg {" +
              "  width: 100vw !important;" +
              "  max-width: 100vw !important;" +
              "  margin-left: 0 !important;" +
              "  margin-right: 0 !important;" +
              "  padding: 0 !important;" +
              "  box-sizing: border-box !important;" +
              "  display: flex !important;" +
              "  justify-content: center !important;" +
              "  align-items: flex-start !important;" +
              "}";
            
            // Add another style element with !important for all container styles
            const styleEl2 = document.createElement('style');
            styleEl2.innerHTML = 
              "@media all {" +
              "  .container, div.container, main.container, " +
              "  .container.padding-top--md.padding-bottom--lg, " +
              "  div.container.padding-top--md.padding-bottom--lg, " +
              "  #__docusaurus .container, " +
              "  #__docusaurus div.container {" +
              "    width: 100vw !important;" +
              "    max-width: 100vw !important;" +
              "    margin-left: 0 !important;" +
              "    margin-right: 0 !important;" +
              "    padding: 0 !important;" +
              "    box-sizing: border-box !important;" +
              "  }" +
              "}";
            
            document.head.appendChild(styleEl);
            document.head.appendChild(styleEl2);
          }
        }
        
        // Also target all containers with a more comprehensive approach
        const containers = document.querySelectorAll('.container, [class*="container"], div.container, main.container, .container.padding-top--md.padding-bottom--lg');
        containers.forEach(container => {
          // Apply all necessary styles with !important
          container.style.setProperty('margin-left', '0', 'important');
          container.style.setProperty('margin-right', '0', 'important');
          container.style.setProperty('margin', '0', 'important');
          container.style.setProperty('padding-left', '0', 'important');
          container.style.setProperty('padding-right', '0', 'important');
          container.style.setProperty('padding', '0', 'important');
          container.style.setProperty('max-width', '100vw', 'important');
          container.style.setProperty('width', '100vw', 'important');
          container.style.setProperty('box-sizing', 'border-box', 'important');
          container.style.setProperty('width', '100vw', 'important');
        });
      }
      
      // Run immediately and periodically
      fixContainerMargins();
      setInterval(fixContainerMargins, 500);
      
      // Handle responsive layout
      function handleResponsiveLayout() {
        const videoContainer = document.querySelector('.video-container');
        const currentVideoContainer = document.getElementById('currentVideoContainer');
        const videoList = document.getElementById('videoList');
        
        if (videoContainer && currentVideoContainer && videoList) {
          if (window.innerWidth <= 1000) {
            // Mobile layout
            videoContainer.style.flexDirection = 'column';
            currentVideoContainer.style.width = '100%';
            currentVideoContainer.style.maxWidth = '100%';
            videoList.style.width = '100%';
            videoList.style.maxWidth = '100%';
            videoList.style.height = 'auto';
            videoList.style.maxHeight = '400px';
            videoList.style.overflowY = 'auto';
          } else {
            // Desktop layout
            videoContainer.style.flexDirection = 'row';
            currentVideoContainer.style.width = 'calc(100% - 400px - 34px)';
            currentVideoContainer.style.maxWidth = 'calc(100% - 400px - 34px)';
            videoList.style.width = '400px';
            videoList.style.maxWidth = '400px';
          }
        }
      }
      
      // Run on load and window resize
      handleResponsiveLayout();
      window.addEventListener('resize', handleResponsiveLayout);
      
      // Direct approach to find and modify the container's parent element
      setTimeout(() => {
        const container = document.querySelector('.container.padding-top--md.padding-bottom--lg');
        if (container) {
          // Get the parent element
          const parent = container.parentElement;
          if (parent) {
            console.log('Found container parent:', parent.tagName, parent.className);
            
            // Modify the parent element's styles
            parent.style.setProperty('margin-left', '0', 'important');
            parent.style.setProperty('margin-right', '0', 'important');
            parent.style.setProperty('padding-left', '0', 'important');
            parent.style.setProperty('padding-right', '0', 'important');
            parent.style.setProperty('max-width', '100vw', 'important');
            parent.style.setProperty('width', '100vw', 'important');
          }
          
          // Modify the container's style attribute directly
          container.setAttribute('style', 'margin-left: 0 !important; margin-right: 0 !important; padding-left: 0 !important; padding-right: 0 !important; max-width: 100vw !important; width: 100vw !important; box-sizing: border-box !important;');
          
          // Also try to modify any inline styles
          if (container.style) {
            container.style.cssText = 'margin-left: 0 !important; margin-right: 0 !important; padding-left: 0 !important; padding-right: 0 !important; max-width: 100vw !important; width: 100vw !important; box-sizing: border-box !important;';
          }
        }
      }, 1000);
      
      // Additional approach to target the container with 273px margin
      document.addEventListener('DOMContentLoaded', function() {
        // Find all containers and check their computed style
        const allContainers = document.querySelectorAll('.container, [class*="container"]');
        allContainers.forEach(container => {
          const computedStyle = window.getComputedStyle(container);
          const marginLeft = computedStyle.getPropertyValue('margin-left');
          const marginRight = computedStyle.getPropertyValue('margin-right');
          
          // If the container has a margin of 273px, log it and fix it
          if (marginLeft === '273px' || marginRight === '273px') {
            console.log('Found container with 273px margin:', container.className);
            container.style.setProperty('margin-left', '0', 'important');
            container.style.setProperty('margin-right', '0', 'important');
            container.style.setProperty('padding-left', '0', 'important');
            container.style.setProperty('padding-right', '0', 'important');
            container.style.setProperty('max-width', '100vw', 'important');
            container.style.setProperty('width', '100vw', 'important');
          }
        });
        
        // Use MutationObserver to watch for changes to the DOM
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' || mutation.type === 'childList') {
              // Check all containers again
              const containers = document.querySelectorAll('.container, [class*="container"]');
              containers.forEach(container => {
                const computedStyle = window.getComputedStyle(container);
                const marginLeft = computedStyle.getPropertyValue('margin-left');
                const marginRight = computedStyle.getPropertyValue('margin-right');
                
                if (marginLeft === '273px' || marginRight === '273px') {
                  console.log('Found container with 273px margin in MutationObserver:', container.className);
                  container.style.setProperty('margin-left', '0', 'important');
                  container.style.setProperty('margin-right', '0', 'important');
                  container.style.setProperty('padding-left', '0', 'important');
                  container.style.setProperty('padding-right', '0', 'important');
                  container.style.setProperty('max-width', '100vw', 'important');
                  container.style.setProperty('width', '100vw', 'important');
                }
              });
            }
          });
        });
        
        // Start observing the document with the configured parameters
        observer.observe(document.body, { 
          attributes: true, 
          childList: true, 
          subtree: true 
        });
      });
    `}} />
    <style dangerouslySetInnerHTML={{__html: `
/* Override ALL Docusaurus containers and wrappers */
html, body, #__docusaurus, #__docusaurus > div, main, main > .container, 
.container, .container > div, article, .theme-doc-markdown, .markdown, 
[class*="docMainContainer"], [class*="docItemContainer"], [class*="docItemCol"], 
[class*="mdxPageWrapper"], [class*="docPage"], [class*="docSidebarContainer"],
div[class^="mainWrapper_"], div[class^="docMainContainer_"], div[class^="docItemContainer_"],
div[class^="docItemCol_"]:not(.footer):not(.footer *), 
div[class^="mdxPageWrapper_"]:not(.footer):not(.footer *), 
div[class^="docPage_"]:not(.footer):not(.footer *),
div[class^="docSidebarContainer_"]:not(.footer):not(.footer *), 
div[class^="container_"]:not(.footer):not(.footer *), 
div[class^="row_"]:not(.footer):not(.footer *),
div[class^="col_"]:not(.footer):not(.footer *), 
div[class^="markdown_"]:not(.footer):not(.footer *), 
div[class^="docusaurus-"]:not(.footer):not(.footer *),
.main-wrapper:not(.footer):not(.footer *), 
.doc-wrapper:not(.footer):not(.footer *), 
.doc-page:not(.footer):not(.footer *), 
.doc-sidebar-container:not(.footer):not(.footer *) {
  max-width: 100vw !important;
  padding: 0 !important;
  margin: 0 !important;
  width: 100vw !important;
  overflow-x: hide !important;
  box-sizing: border-box !important;
  flex-basis: 100% !important;
  flex-grow: 1 !important;
  flex-shrink: 0 !important;
  position: relative !important;
}

/_ Ensure footer is properly styled _/
.footer {
width: 100% !important;
max-width: 100% !important;
margin: 0 !important;
padding: 2rem 1rem !important;
box-sizing: border-box !important;
display: block !important;
}

.footer .row {
display: flex !important;
flex-wrap: wrap !important;
width: 100% !important;
margin: 0 !important;
justify-content: space-between !important;
}

.footer .footer\_\_col {
flex: 1 0 200px !important;
margin-bottom: 1rem !important;
padding: 0 1rem !important;
}

/_ Target specific container classes with margin - excluding footer _/
.container.padding-top--md:not(.footer),
.container.padding-bottom--lg:not(.footer),
.container.padding-vert--lg:not(.footer),
.container.padding-vert--md:not(.footer),
.container.padding-vert--sm:not(.footer),
div[class^="container padding-"]:not(.footer),
div[class*=" container padding-"]:not(.footer) {
margin-left: 0 !important;
margin-right: 0 !important;
padding-left: 0 !important;
padding-right: 0 !important;
max-width: 100vw !important;
}

article {
padding: 0 !important;
margin: 0 !important;
max-width: 100vw !important;
width: 100vw !important;
overflow-x: visible !important;
}

/_ Target main content container _/
main > .container,
.container.container--fluid,
.container.margin-vert--lg,
.container.margin-vert--md,
.container.margin-vert--sm,
div[class^="container margin-"],
div[class*=" container margin-"],
.container.padding-top--md.padding-bottom--lg,
.container.padding-vert--lg,
.container.padding-vert--md,
.container.padding-vert--sm,
div[class^="container padding-"],
div[class*=" container padding-"] {
margin-left: 0 !important;
margin-right: 0 !important;
padding-left: 0 !important;
padding-right: 0 !important;
max-width: 100vw !important;
width: 100vw !important;
}

/_ Target specific container with 273px margin _/
.container.padding-top--md.padding-bottom--lg,
.container.padding-top--md,
.container.padding-bottom--lg,
div[class^="container_"],
div[class*=" container_"],
div[class^="container padding-top--md padding-bottom--lg"],
div[class*=" container padding-top--md padding-bottom--lg"] {
margin-left: 0 !important;
margin-right: 0 !important;
max-width: 100vw !important;
width: 100vw !important;
}

/_ Target all containers with any class _/
.container,
div[class*="container"] {
margin-left: 0 !important;
margin-right: 0 !important;
max-width: 100vw !important;
width: 100vw !important;
}

/_ Target the exact style rule causing the 273px margin _/
body .container.padding-top--md.padding-bottom--lg, #**docusaurus .container.padding-top--md.padding-bottom--lg,
body div.container.padding-top--md.padding-bottom--lg, #**docusaurus div.container.padding-top--md.padding-bottom--lg {
width: 100vw !important;
max-width: 100vw !important;
margin-left: 0 !important;
margin-right: 0 !important;
padding: 0 !important;
box-sizing: border-box !important;
}

/_ Target the specific container with 273px margin - with highest specificity _/
html body #\_\_docusaurus .container.padding-top--md.padding-bottom--lg {
margin-left: 0 !important;
margin-right: 0 !important;
padding-left: 0 !important;
padding-right: 0 !important;
max-width: 100vw !important;
width: 100vw !important;
}

/_ Target with attribute selector for higher specificity _/
html body #\_\_docusaurus div[class\*="container"][class*="padding-top--md"][class*="padding-bottom--lg"] {
margin-left: 0 !important;
margin-right: 0 !important;
padding-left: 0 !important;
padding-right: 0 !important;
max-width: 100vw !important;
width: 100vw !important;
}

.theme-doc-markdown.markdown header {
display: none !important;
}

.theme-doc-markdown.markdown h1:first-child {
display: none !important;
}

/_ Fix theme toggle in light mode _/
html[data-theme='light'] .clean-btn {
color: #1c1e21 !important;
}

.video-container {
display: flex !important;
flex-direction: row !important;
gap: 15px !important;
margin: 0 !important;
width: 100vw !important;
padding: 20px 20px 20px 20px !important; /_ Reduced left padding _/
max-width: 100vw !important;
justify-content: flex-start !important;
min-height: calc(100vh - var(--ifm-navbar-height)) !important;
box-sizing: border-box !important;
flex-wrap: nowrap !important;
align-items: flex-start !important;
position: relative !important;
z-index: 1 !important;
}

        .video-player {
          flex: 1 1 auto !important;
          min-width: 640px !important;
          position: relative !important;
          border-radius: 12px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15) !important;
          background-color: #000 !important;
          max-width: none !important;
          width: calc(100vw - 400px - 55px) !important; /* 400px for video-list, 55px for padding and gap */
          height: calc(100vh - var(--ifm-navbar-height) - 40px) !important;
          box-sizing: border-box !important;
          flex-basis: calc(100vw - 400px - 55px) !important;
          margin-left: 0 !important;
        }

        .video-player #currentVideo {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .video-player iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .video-list {
          flex: 0 0 400px !important;
          height: calc(100vh - var(--ifm-navbar-height) - 40px) !important;
          overflow-y: auto !important;
          background: rgba(0, 0, 0, 0.1) !important;
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.2) !important;
          min-width: 400px !important;
          max-width: 400px !important;
          width: 400px !important;
          box-sizing: border-box !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          z-index: 10 !important;
          right: 0 !important;
          top: 0 !important;
          margin-left: auto !important;
        }

        .video-item {
          display: flex;
          margin-bottom: 6px;
          cursor: pointer;
          padding: 6px 10px;
          border-radius: 8px;
          transition: background 0.1s ease;
          background: transparent;
          box-shadow: none;
          border: none;
          position: relative;
          width: 100%;
        }

        .video-item .share-button {
          position: absolute;
          right: 10px;
          top: 10px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          background: rgba(0, 0, 0, 0.5);
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .video-item:hover .share-button {
          opacity: 1;
        }

        html[data-theme='light'] .video-item .share-button {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(0, 0, 0, 0.6);
        }

        .video-item:last-child {
          margin-bottom: 0;
        }

        .video-item:hover {
          transform: none;
          box-shadow: none;
          background-color: rgba(255, 255, 255, 0.1);
        }

        .video-item.active {
          background-color: rgba(255, 255, 255, 0.2);
          border-left: none;
          box-shadow: none;
        }

        .video-thumbnail {
          width: 150px;
          height: 84px;
          background-color: #000;
          margin-right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
        }

        /* Removed timestamp overlay */

        .video-duration-overlay {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          font-size: 12px;
          padding: 1px 4px;
          border-radius: 2px;
          font-family: 'Roboto', sans-serif;
          font-weight: 500;
        }

        /* Removed with-timestamp class */

        .video-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: none;
        }

        .video-item:hover .video-thumbnail img {
          transform: none;
        }

        .video-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: flex-start;
          padding-top: 2px;
        }

        .video-timestamp {
          font-weight: 500;
          font-size: 14px;
          color: var(--video-text-color);
          background-color: transparent;
          padding: 0;
          border-radius: 0;
          display: block;
          width: 100%;
          font-family: 'Roboto', Arial, sans-serif;
          line-height: 1.4;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .video-item.active .video-timestamp {
          background-color: transparent;
          font-weight: 700;
        }

        .video-description {
          font-size: 11px;
          line-height: 1.2;
          margin: 0;
          padding: 0;
          width: 100%;
          color: var(--ifm-color-emphasis-700);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          font-family: 'Roboto', Arial, sans-serif;
        }

        .video-duration {
          font-size: 11px;
          line-height: 1.2;
          color: var(--ifm-color-emphasis-600);
          font-weight: 400;
          margin-top: 2px;
          font-family: 'Roboto', Arial, sans-serif;
        }

        /* Add a new media query for large screens */
        @media (min-width: 1400px) {
          .video-player {
            width: calc(100vw - 400px - 95px) !important; /* 400px for video-list, 95px for padding and gap */
            min-width: calc(100vw - 400px - 95px) !important;
            max-width: calc(100vw - 400px - 95px) !important;
            flex-basis: calc(100vw - 400px - 95px) !important;
          }

          .video-container {
            width: 100vw !important;
            max-width: 100vw !important;
            padding: 20px 20px 20px 60px !important;
            box-sizing: border-box !important;
            justify-content: flex-start !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            gap: 15px !important;
          }

          .video-list {
            flex: 0 0 400px !important;
            width: 400px !important;
            min-width: 400px !important;
            max-width: 400px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }

        @media (max-width: 1000px) {
          .video-container {
            flex-direction: column !important;
            padding: 16px !important;
            min-height: auto !important;
            background: transparent !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          #currentVideoContainer {
            width: 100% !important;
            max-width: 100% !important;
            margin-bottom: 20px !important;
          }

          #videoList {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 400px !important;
            overflow-y: auto !important;
          }

          .video-item {
            width: 100% !important;
            max-width: 100% !important;
          }

          .video-player {
            width: 100% !important;
            min-width: auto !important;
            margin-bottom: 16px !important;
            height: 50vh !important;
            margin-left: 0 !important;
          }

          .video-list {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 40vh !important;
            min-width: auto !important;
            padding: 10px !important;
            margin-top: 10px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: rgba(0, 0, 0, 0.1) !important;
            border-radius: 12px !important;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2) !important;
          }

          .video-item {
            margin-bottom: 6px;
          }

          .video-thumbnail {
            width: 120px;
            height: 68px;
            border-radius: 6px;
          }

          .video-timestamp {
            font-size: 15px;
          }
        }

        /* YouTube-style scrollbar */
        .video-list::-webkit-scrollbar {
          width: 8px;
        }

        .video-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .video-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        .video-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        /* Theme handling */
        :root {
          --video-text-color: #fff;
          --video-item-hover: rgba(255, 255, 255, 0.1);
          --video-item-active: rgba(255, 255, 255, 0.2);
          --scrollbar-thumb: rgba(255, 255, 255, 0.3);
          --scrollbar-thumb-hover: rgba(255, 255, 255, 0.5);
        }

        html[data-theme='light'] {
          --video-text-color: #0f0f0f;
          --video-item-hover: rgba(0, 0, 0, 0.05);
          --video-item-active: rgba(0, 0, 0, 0.1);
          --scrollbar-thumb: rgba(0, 0, 0, 0.2);
          --scrollbar-thumb-hover: rgba(0, 0, 0, 0.3);
        }

        /* Apply theme variables */
        .video-container {
          background: transparent;
          margin-left: 0 !important;
          padding-left: 20px !important;
        }

        /* Video container responsive styles */
        #videoMainContainer {
          display: flex !important;
          flex-direction: row !important;
          gap: 15px !important;
          margin: 0 !important;
          width: 100vw !important;
          max-width: 100vw !important;
          flex-wrap: nowrap !important;
          padding: 20px !important;
        }

        /* Video player container */
        #currentVideoContainer {
          flex: 1 !important;
          min-width: 0 !important;
        }

        /* Video list container */
        #videoList {
          width: 400px !important;
          max-width: 400px !important;
          flex-shrink: 0 !important;
        }

        /* Responsive styles for mobile */
        @media (max-width: 1000px) {
          #videoMainContainer {
            flex-direction: column !important;
            gap: 20px !important;
          }

          #currentVideoContainer {
            width: 100% !important;
            max-width: 100% !important;
          }

          #videoList {
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 400px !important;
            overflow-y: auto !important;
          }

          .video-item {
            width: 100% !important;
          }
        }

        /* Target content wrapper */
        .row .col.col--8,
        .row .col.col--9,
        .row .col.col--10,
        .row .col.col--11,
        .row .col.col--12,
        div[class^="col col--"],
        div[class*=" col col--"] {
          margin-left: 0 !important;
          margin-right: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          max-width: 100% !important;
          flex-basis: 100% !important;
        }

        .video-timestamp {
          color: var(--video-text-color);
        }

        .video-item:hover {
          background: var(--video-item-hover);
        }

        .video-item.active {
          background: var(--video-item-active);
        }

        .video-list::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb);
        }

        .video-list::-webkit-scrollbar-thumb:hover {
          background: var(--scrollbar-thumb-hover);
        }

        /* Hide page title */
        .theme-doc-markdown.markdown header {
          display: none;
        }
      `}} />

    <div className="video-player" id="videoPlayer" style={{marginLeft: 0, flex: '1 1 auto'}}>
      <div id="currentVideo"></div>
    </div>

    <div
      className="video-list"
      id="videoList"
      style={{
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        width: '400px',
        minWidth: '400px',
        maxWidth: '400px',
        flex: '0 0 400px',
        position: 'relative',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
        padding: '10px',
        height: 'calc(100vh - var(--ifm-navbar-height) - 40px)',
        overflowY: 'auto'
      }}>
      {videoData && videoData.videos && videoData.videos.length > 0 ? (
        videoData.videos.map((video, index) => {
          // Use video ID directly
          const videoIdWithParams = video.id;

          return (
            <div
              key={index}
              className={`video-item ${index === 0 ? 'active' : ''}`}
              data-video-id={videoIdWithParams}
              data-video-title={video.title}
              data-video-description={video.description}
            >
              <div className="video-thumbnail">
                <img
                  src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                  alt={`${video.title} Thumbnail`}
                />
                {video.duration && (
                  <div className="video-duration-overlay">
                    {video.duration}
                  </div>
                )}
              </div>
              <div className="video-info">
                <div className="video-timestamp">{video.title}</div>
                <div className="video-description">{video.description}</div>
              </div>
              <button className="share-button" title="Share this video">
                <i className="fas fa-share-alt"></i> Share
              </button>
            </div>
          );
        })
      ) : (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.5)',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h3>Video list is loading...</h3>
          <p>If the video list doesn't appear, please refresh the page.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3578e5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Refresh Page
          </button>
        </div>
      )}
    </div>

  </div>
  </>
);
};

<BrowserOnly>
  {() => <VideoGallery />}
</BrowserOnly>

