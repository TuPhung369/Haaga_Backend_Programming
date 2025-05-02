---
sidebar_position: 2
description: "Project Video"
hide_table_of_contents: true
---

import React, { useEffect } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Head from '@docusaurus/Head';
import videoData from './videos.json';

export const VideoGallery = () => {
// Add YouTube API
const YouTubeAPIScript = () => (

<Head>
<script src="https://www.youtube.com/iframe_api" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" />
</Head>
);
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
setTimeout(ensureVideoItemsLoaded, 500);
} else {
console.log('Video items loaded, handling hash');
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

        // Get video ID and start time
        const videoId = video.id;
        const startTime = video.startTime || 0;

        console.log('Loading video ID:', videoId, 'with start time:', startTime);

        // Load the video with the correct start time
        player.loadVideoById({
          'videoId': videoId,
          'startSeconds': startTime,
          'suggestedQuality': 'hd1080'
        });

        // Also seek to the timestamp to make sure it works
        if (startTime > 0) {
          setTimeout(() => {
            player.seekTo(startTime, true);
          }, 1000);
        }

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

      // Get video ID and start time
      const videoId = video.id;
      const startTime = video.startTime || 0;

      console.log('Loading video ID:', videoId, 'with start time:', startTime);

      // Load the video with the correct start time
      player.loadVideoById({
        'videoId': videoId,
        'startSeconds': startTime,
        'suggestedQuality': 'hd1080'
      });

      // Also seek to the timestamp to make sure it works
      if (startTime > 0) {
        setTimeout(() => {
          player.seekTo(startTime, true);
        }, 1000);
      }

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

          // Check for timestamp in the video ID
          let startTime = 0;
          if (videoId.includes('t=')) {
            const timeMatch = videoId.match(/t=(\d+)/);
            if (timeMatch && timeMatch[1]) {
              startTime = parseInt(timeMatch[1], 10);
              console.log('Found timestamp in video ID:', startTime);
            }
          }

          // Load the video with quality settings
          console.log('Loading video with ID:', baseVideoId);
          player.loadVideoById({
            'videoId': baseVideoId,
            'startSeconds': startTime,
            'suggestedQuality': 'hd1080'
          });

          // Also seek to the timestamp to make sure it works
          if (startTime > 0) {
            console.log('Seeking to timestamp:', startTime);
            setTimeout(() => {
              player.seekTo(startTime, true);
            }, 1000);
          }
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

return (
<>
<YouTubeAPIScript />

  <div className="video-container">
    <style dangerouslySetInnerHTML={{__html: `
/* Override Docusaurus container and hide header */
main > .container {
  max-width: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  width: 100% !important;
}

article {
padding: 0 !important;
margin: 0 !important;
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
display: flex;
flex-direction: row;
gap: 34px;
margin: 0;
width: 100%;
padding: 20px 20px 20px 60px; /_ Increased left padding by 40px _/
max-width: none;
justify-content: center;
min-height: calc(100vh - var(--ifm-navbar-height));
}

        .video-player {
          flex: 3;
          min-width: 640px;
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          background-color: #000;
          max-width: 1200px;
          height: calc(100vh - var(--ifm-navbar-height) - 40px);
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
          flex: 1;
          height: calc(100vh - var(--ifm-navbar-height) - 40px);
          overflow-y: auto;
          background: transparent;
          border-radius: 12px;
          padding: 0;
          box-shadow: none;
          min-width: 370px;
          max-width: 450px;
          width: 100%;
        }

        .video-item {
          display: flex;
          margin-bottom: 12px;
          cursor: pointer;
          padding: 10px;
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
          width: 168px;
          height: 94px;
          background-color: #000;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          flex-shrink: 0;
        }

        .video-timestamp-overlay {
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
          align-items: flex-start;
          justify-content: flex-start;
          padding-top: 2px;
        }

        .video-timestamp {
          font-weight: 500;
          font-size: 16px;
          color: var(--video-text-color);
          background-color: transparent;
          padding: 0;
          border-radius: 0;
          display: inline-block;
          font-family: 'Roboto', Arial, sans-serif;
          line-height: 1.4;
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

        @media (max-width: 1000px) {
          .video-container {
            flex-direction: column;
            padding: 16px 16px 16px 56px; /* Increased left padding by 40px */
            min-height: auto;
            background: transparent;
          }

          .video-player {
            width: 100%;
            min-width: auto;
            margin-bottom: 16px;
            height: 50vh;
          }

          .video-list {
            width: 100%;
            max-width: 100%;
            height: auto;
            max-height: 40vh;
            min-width: auto;
            padding: 0;
            margin-top: 10px;
          }

          .video-item {
            margin-bottom: 12px;
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

    <div className="video-player" id="videoPlayer">
      <div id="currentVideo"></div>
    </div>

    <div className="video-list" id="videoList">
      {videoData.videos.map((video, index) => {
        // Construct video ID with timestamp if needed
        const videoIdWithParams = video.startTime ? `${video.id}?t=${video.startTime}` : video.id;

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
              {video.startTime && (
                <div className="video-timestamp-overlay">{Math.floor(video.startTime / 60)}:{(video.startTime % 60).toString().padStart(2, '0')}</div>
              )}
            </div>
            <div className="video-info">
              <div className="video-timestamp">{video.title}</div>
            </div>
            <button className="share-button" title="Share this video">
              <i className="fas fa-share-alt"></i> Share
            </button>
          </div>
        );
      })}
    </div>

  </div>
  </>
);
};

<BrowserOnly>
  {() => <VideoGallery />}
</BrowserOnly>

