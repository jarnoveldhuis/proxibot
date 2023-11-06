// Declare variables for timers and delays
let thinkingTimer;
let laughTimer;
const thinkDelay = 2000;
const laughLength = 2000;


let submitTo = "";
let avatar = "Adam";
let transcriptText = 'Podcast Introduction.';
let submitAs = document.getElementById('submitAs').value;
let podCast = document.getElementById('podCast').value;
let laugh
let laughs
let radomLaugh
let previousResponse = '';
let isRequestPending = false;
let transcriptButtonHtml = `<button class="btn" id="showFormBtn" data-bs-toggle="modal" data-bs-target="#transcriptModal">
<i class="fas fa-file-alt"></i>
</button>`


function askBot(event) {
  if (isRequestPending) return;

  audioControls.style.display = 'none';
  isRequestPending = true;
  submitTo = event instanceof Event ? event.submitter.value : null;

  if (submitTo === "Stav" || submitTo === "Adam" || submitTo === "Nick") {
    avatar = submitTo;
    disable = avatar;
  }
  // else if (submitTo === "General") {
  // submitTo = "All";
  // avatar = document.getElementById('submitTo').value;
  // }
  else {
    disable = avatar;
    avatar = "Guest";
  }

  // Select all submit buttons
  let submitButtons = document.querySelectorAll('input[type="submit"]');

  // Loop through them and disable the one with the same value as the avatar
  submitButtons.forEach(button => {
    if (button.value === avatar) {
      button.disabled = true;
    } else {
      button.disabled = false;
    }
  });

  // Get the botResponse element
  const botResponse = document.getElementById('botResponse');
  const prompt = document.getElementById('prompt');

  // Get user input elements
  const userInputElem = document.getElementById('userInput');
  const submitAsElem = document.getElementById('submitAs');
  let submitAs = submitAsElem.value;
  const botImage = document.getElementById('botImage');
  let userInputValue = userInputElem.value;

  document.getElementById('submitAs').addEventListener('change', function () {
    updateAvatar(submitAs, 'submitAs');
    botResponse.textContent = document.getElementById('userInput').value;
    document.getElementById('botImage').src = "/img/" + avatar + "/neutral.svg";
    toggleResponseContainer();
  });

  // Append the userInputValue with the clicked button name and a colon if submitTo is present
  if (userInputValue) {
    userInputValue = `${submitAs}: ${userInputValue}`;
    prompt.textContent = userInputValue;
    prompt.innerHTML += transcriptButtonHtml;
  }

  // Check if userInputValue is empty, if so use the last bot's response
  if (!userInputValue.trim()) {
    userInputValue = `${submitAs}: `;
    if (previousResponse) {
      prompt.textContent = previousResponse;
      prompt.innerHTML += transcriptButtonHtml;
    }
  };

  // Clear the input field immediately after the function runs
  userInputElem.value = '';

  // Set a timeout to update the bot image to thinking image
  thinkingTimer = setTimeout(() => {
    botImage.src = "/img/" + avatar + "/think.svg";
  }, thinkDelay);

  // Clear the botResponse and add a 'loading' class to it
  botResponse.textContent = '.';
  botResponse.classList.add('loading');
  askBot.disabled = true;
  toggleResponseContainer();

  // Make a POST request to the '/ask' endpoint with the user's input
  if (userInputValue != `${submitAs}: `) {
    appendToTranscript(userInputValue);

  }

  fetch('/ask', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ question: userInputValue, podCast: podCast, transcript: transcriptText, submitTo: submitTo })
  })
    .then(response => response.json())
    .then(data => {

      // Clear the thinkingTimer and update the botResponse with the data received
      clearTimeout(thinkingTimer);
      let updatedText = data.answer.split(':').slice(1).join(':').trim();
      // Extract the name and the text separately
      let name = data.answer.split(':')[0].trim() + ': '; // Extract the name
      let textWithoutName = data.answer.substring(name.length); // Get the text without the name

      // Update the botResponse with the text without the name
      botResponse.textContent = textWithoutName;

      // Call textToSpeech with the full response (including the name) and the text without the name
      textToSpeech(data.answer, textWithoutName);
      botResponse.textContent = updatedText;
      previousResponse = data.answer;
      isRequestPending = false;

      console.log(data.answer)
      response = data.answer;
      toggleResponseContainer();

      // appendToTranscript(data.answer);
      botResponse.classList.remove('loading');
      askBot.disabled = false;
      disabled = avatar;

      if (avatar != "Stav" && avatar != "Adam" && avatar != "Nick") {
        avatar = "Guest";

        // Select all submit buttons
        let submitButtons = document.querySelectorAll('input[type="submit"]');

        // Loop through them and disable the one with the same value as the avatar
        submitButtons.forEach(button => {
          if (button.value === disabled) {
            button.disabled = true;
          } else {
            button.disabled = false; // You might want to enable the other buttons
          }
        });
      };

      botImage.src = "/img/" + avatar + "/laugh.svg";
      laughs = ['stavlaugh1.m4a', 'stavlaugh2.m4a', 'stavlaugh3.m4a', 'stavlaugh4.m4a', 'stavlaugh5.m4a', 'stavlaugh6.m4a', 'stavlaugh7.m4a', 'stavlaugh8.m4a', 'stavlaugh9.m4a', 'stavlaugh10.m4a', 'stavlaugh11.m4a', 'stavlaugh12.m4a', 'stavlaugh13.m4a', 'stavlaugh14.m4a', 'StavCackle1.mp3', 'StavCackle2.mp3',];
      randomLaugh = laughs[Math.floor(Math.random() * laughs.length)];
      laugh = new Audio('/laughs/' + randomLaugh);
      laughTimer = setTimeout(() => {
        botImage.src = "/img/" + avatar + "/neutral.svg";
        botImage.classList.remove('laughing');
      }, laughLength);
      if (submitTo === "Stav") {

        botImage.classList.add('laughing');
        laughTimer = setTimeout(() => {
          botImage.src = "/img/" + avatar + "/neutral.svg";
          botImage.classList.remove('laughing');
        }, laughLength);
        if (isTtsEnabled) {
          laugh.play();
        }
      };
    })
    .catch(error => {
      // If there's an error, clear the thinkingTimer and update the botResponse and bot image
      clearTimeout(thinkingTimer);
      botResponse.textContent = 'Error communicating with the bot.';
      botResponse.classList.remove('loading');
      botImage.src = "/img/error.svg";
      console.error('Error:', error);
      isRequestPending = false;
    });
}

function playAudio(audioUrl) {
  const audio = new Audio(audioUrl);
  audio.play().catch(e => console.error('Error attempting to play audio:', e));
}

function appendToTranscript(content, audioUrl) {
  const transcript = document.getElementById('transcript');
  const newContent = content.replace(/<br>/g, '\n'); // Replace <br> tags with newline characters

  // Highlight specific words
  content = content.replace(/(Stav:)/g, '<span class="stav">$1</span>');
  content = content.replace(/(Nick:)/g, '<span class="nick">$1</span>');
  content = content.replace(/(Adam:)/g, '<span class="adam">$1</span>');

  // Generate unique IDs for the audio controls
  let audioControlsHtml = '';
  if (audioUrl) {
    const uniqueId = Date.now(); // A simple unique ID using the current timestamp
    const downloadLinkId = `downloadLink-${uniqueId}`;

    // Create the HTML for the play button and download link
    audioControlsHtml = `
    <a href="#" onclick="playAudio('${audioUrl}'); return false;" id="playButton-${uniqueId}" class="audio-control-icon" title="Play">
    <i class="fas fa-play audio-control-icon"></i>
    </a>
    
    <a href="${audioUrl}" download="tts_output-${uniqueId}.mp3" id="${downloadLinkId}" class="audio-control-icon" title="Download">
      <i class="fas fa-download audio-control-icon"></i>
    </a>
  `;
  }

  // Insert the audio controls (if any) and content into the transcript
  transcript.innerHTML += "<br>" + audioControlsHtml + content;
  transcriptText += '\n' + newContent; // Assuming transcriptText is a variable holding the full transcript text

}

let isTtsEnabled = false;

// Function to toggle TTS state
function toggleTtsState() {
  isTtsEnabled = !isTtsEnabled;
  var icon = document.getElementById('ttsIcon');
  if (isTtsEnabled) {
    console.log('Voice is ON');
    icon.classList.replace('fa-volume-mute', 'fa-volume-up');
    // Perform actions to enable the voice feature
  } else {
    console.log('Voice is OFF');
    icon.classList.replace('fa-volume-up', 'fa-volume-mute');
    // Perform actions to disable the voice feature
  }
}

document.getElementById('ttsButton').addEventListener('click', toggleTtsState);

async function textToSpeech(fullText, ttsText) {
  const tts = document.getElementById('ttsCheck');
  const voiceLoad = document.getElementById('voiceLoad');
  const botResponse = document.getElementById('botResponse');
  const audioControls = document.getElementById('audioControls');
  const playIcon = document.getElementById('playIcon');
  const downloadIcon = document.getElementById('downloadIcon');

  if (isTtsEnabled) {
    isRequestPending = true;
    text = botResponse.textContent;
    voiceLoad.classList.add('loading');

    try {
      const response = await fetch('/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: ttsText })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audio.play();
      // Append the response and the audio controls to the transcript
      appendToTranscript(fullText, audioUrl);

      // Set up the replay icon
      playIcon.onclick = function () {
        audio.currentTime = 0; // Rewind the audio to the start
        audio.play().catch(e => console.error('Error attempting to replay audio:', e));
      };

      // Set up the download icon
      downloadIcon.onclick = function () {
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = 'tts_output.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      // Show the audio controls
      audioControls.style.display = 'block';



      // Handle any errors that occur during playback
      audio.addEventListener('error', (e) => {
        let error = e.target.error;
        console.error('Error playing audio. Code:', error.code, 'Message:', error.message);
      });

      voiceLoad.classList.remove('loading');
      isRequestPending = false;
    } catch (error) {
      console.error('Text to Speech conversion error:', error);
      voiceLoad.classList.remove('loading');
      isRequestPending = false;
    }
  } else {
    appendToTranscript(fullText); // No audioUrl passed, so no controls will be added
    isRequestPending = false;
  }
}

// Function to revert the bot image back to the original after user is done typing
function doneTyping() {
  document.getElementById('botImage').src = "/img/" + avatar + "/neutral.svg";
}

function extractName(userMessage) {
  // Extract the name from the user's message, assuming format "Name: message"
  avatar = userMessage.split(':')[0].trim();
  document.getElementById('botImage').src = "/img/" + avatar + "/neutral.svg";
}

function updateAvatar(submit, id) {
  submit = document.getElementById(id).value
  if (submit === "Stav" || submit === "Adam" || submit === "Nick") {
    avatar = document.getElementById(id).value;
  }
  else if (submit === "All") {
    // avatar = document.getElementById(id).value;
    // submitAs = document.getElementById('submitAs').value;
  }
  else {
    avatar = "Guest";
  }

  // Select all submit buttons
  let submitButtons = document.querySelectorAll('input[type="submit"]');

  // Loop through them and disable the one with the same value as the avatar
  submitButtons.forEach(button => {
    if (button.value === avatar) {
      button.disabled = true;
    } else {
      button.disabled = false; // You might want to enable the other buttons
    }
  });
}


function toggleResponseContainer() {
  var botResponse = document.getElementById('botResponse');
  var responseContainer = document.getElementById('response-container');

  if (botResponse.textContent.trim() === "") {
    responseContainer.style.display = "none";
  }
  else {
    responseContainer.style.display = "block";
  }
}

// Function to add a new button to the form
function addButton() {
  const buttonNameInput = document.getElementById('buttonName');
  const buttonName = buttonNameInput.value;

  if (buttonName.trim() === '') {
    alert('Please enter a button name.');
    return;
  }

  const submitGroup = document.getElementById('submitTo'); // Get the toggle button
  const newButton = document.createElement('input'); // Create a new input element for the page button
  newButton.setAttribute('type', 'submit');
  newButton.setAttribute('value', buttonName);
  newButton.setAttribute('class', 'btn btn-outline-dark btn-sm');

  // Insert the new page button before the toggle button
  submitGroup.appendChild(newButton);

  const submitAsDropdown = document.getElementById('submitAs'); // Get the dropdown
  const newOption = document.createElement('option'); // Create a new option element
  newOption.setAttribute('value', buttonName);
  newOption.textContent = buttonName; // Set the visible text content

  // Append the new option to the dropdown
  submitAsDropdown.appendChild(newOption);

  const guestsContainer = document.getElementById('guests');

  addGuestButton.disabled = true;


  const breakElement = document.createElement('br');
  const removeButton = document.createElement('input'); // Create a new input element for the modal button
  removeButton.textContent = buttonName;
  removeButton.setAttribute('type', 'button');
  removeButton.setAttribute('value', 'Remove ' + buttonName);
  removeButton.setAttribute('class', 'btn btn-outline-dark btn-sm');

  guestsContainer.appendChild(breakElement);
  guestsContainer.appendChild(removeButton);

  // Clear the input field
  buttonNameInput.value = '';

  // Event listener for the modal button
  removeButton.addEventListener('click', function () {
    // Remove the modal button and its preceding break element
    guestsContainer.removeChild(this.previousElementSibling);  // Removes the <br> before the removeButton
    guestsContainer.removeChild(this);  // Removes the removeButton

    // Remove the page button
    submitGroup.removeChild(newButton);

    // Remove the option from the dropdown
    submitAsDropdown.removeChild(newOption);
    addGuestButton.disabled = false;
  });

}

// Event listeners to change the bot image when the user interacts with the input field
document.getElementById('userInput').addEventListener('focus', function () {
  document.getElementById('botImage').src = "/img/" + avatar + "/neutral.svg";
});

let typingTimer;
const doneTypingInterval = 250;

document.getElementById('userInput').addEventListener('keypress', function () {
  updateAvatar(submitAs, 'submitAs');
  clearTimeout(typingTimer);
  document.getElementById('botImage').src = "/img/" + avatar + "/speak.svg";
  typingTimer = setTimeout(doneTyping, doneTypingInterval);
  // document.getElementById('botImage').src = "/img/" + avatar + "/neutral.svg";

});

document.getElementById('submitAs').addEventListener('change', function () {
  updateAvatar(submitAs, 'submitAs');
  document.getElementById('prompt').textContent = data.answer;
  botResponse.textContent = document.getElementById('userInput').value;
  document.getElementById('botImage').src = "/img/" + avatar + "/neutral.svg";
  toggleResponseContainer();
});

document.getElementById('userInput').addEventListener('input', function () {
  updateAvatar(submitAs, 'submitAs');
  botResponse.textContent = document.getElementById('userInput').value;
  toggleResponseContainer();
  // document.getElementById('botImage').src = "/img/" + avatar + "/neutral.svg";
});

document.querySelector('form').addEventListener('submit', function (event) {
  clearTimeout(typingTimer);
  document.getElementById('botImage').src = "/img/" + avatar + "/listening.svg";
});



// Event listener to adjust the view when the input field is focused
document.addEventListener('DOMContentLoaded', (event) => {
  const inputElement = document.getElementById('userInput');
  const imageElement = document.getElementById('botImage');
  inputElement.addEventListener('focus', function () {
    imageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

});

// Event listener to set default bot's response when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', (event) => {
  const botResponse = document.getElementById('botResponse');
  botResponse.textContent = ``;
});



document.addEventListener('DOMContentLoaded', function () {
  const podcastDropdown = document.getElementById('podCast');
  const stavCheckbox = document.getElementById('btncheck3');
  const stavButton = document.querySelector('label[for="btncheck3"]');
  const submitToButtonGroup = document.getElementById('submitTo');
  const submitAsDropdown = document.getElementById('submitAs');

  function addStav() {
    stavCheckbox.checked = true;
    stavButton.classList.remove('disabled');

    const stavOption = document.createElement('option');
    stavOption.value = 'Stav';
    stavOption.textContent = 'Stav';
    submitAsDropdown.appendChild(stavOption);

    const stavSubmitButton = document.createElement('input');
    stavSubmitButton.type = 'submit';
    stavSubmitButton.name = 'go';
    stavSubmitButton.value = 'Stav';
    stavSubmitButton.className = 'btn btn-outline-dark btn-sm';
    submitToButtonGroup.appendChild(stavSubmitButton);
  }

  function removeStav() {
    stavCheckbox.checked = false;
    stavButton.classList.add('disabled');

    const stavOption = submitAsDropdown.querySelector('option[value="Stav"]');
    if (stavOption) submitAsDropdown.removeChild(stavOption);

    const stavSubmitButton = submitToButtonGroup.querySelector('input[value="Stav"]');
    if (stavSubmitButton) submitToButtonGroup.removeChild(stavSubmitButton);
  }

  podcastDropdown.addEventListener('change', function () {
    document.getElementById('prompt').textContent = ''
    if (podcastDropdown.value === 'Cum Town') {
      addStav();
      transcript.innerHTML = ''
      transcriptText = 'Introduce the episode.'
      podCast = document.getElementById('podCast').value;
    } else if (podcastDropdown.value === 'The Adam Friedland Show') {
      removeStav();
      transcript.innerHTML = ''
      transcriptText = 'Introduce the episode'
      podCast = document.getElementById('podCast').value;
    }
  });
});


document.addEventListener('DOMContentLoaded', function () {
  const hostButtons = document.getElementById('hostButtons');
  const submitAsButton = document.getElementById('submitAs');
  const submitToButtonGroup = document.getElementById('submitTo');

  hostButtons.addEventListener('change', function (e) {
    if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
      const hostName = e.target.nextElementSibling.textContent;
      const checkedBoxes = hostButtons.querySelectorAll('input[type="checkbox"]:checked');

      if (!e.target.checked && checkedBoxes.length === 0) {
        // Prevent unchecking if it's the last remaining checked checkbox
        e.preventDefault();
        alert('At least one host must be selected.');
        e.target.checked = true; // Ensure the checkbox stays checked
        return;
      }

      if (e.target.checked) {
        // Host is checked, add to submit buttons
        const optionAs = document.createElement('option');
        optionAs.value = hostName;
        optionAs.textContent = hostName;
        submitAsButton.appendChild(optionAs);

        const submitToButton = document.createElement('input');
        submitToButton.setAttribute('type', 'submit');
        submitToButton.setAttribute('name', 'go');
        submitToButton.setAttribute('value', hostName);
        submitToButton.setAttribute('class', 'btn btn-outline-dark btn-sm');
        submitToButtonGroup.appendChild(submitToButton);
      } else {
        // Host is unchecked, remove from submit buttons
        const optionToRemoveAs = Array.from(submitAsButton.options).find(option => option.value === hostName);
        if (optionToRemoveAs) {
          submitAsButton.removeChild(optionToRemoveAs);
        }

        const submitToButtonToRemove = Array.from(submitToButtonGroup.children).find(button => button.value === hostName);
        if (submitToButtonToRemove) {
          submitToButtonGroup.removeChild(submitToButtonToRemove);
        }
      }
    }
  });
});


document.addEventListener('DOMContentLoaded', function () {
  const podcastDropdown = document.getElementById('podCast');
  const stavCheckbox = document.getElementById('btncheck3');
  const stavButton = document.querySelector('label[for="btncheck3"]');
  const submitToButtonGroup = document.getElementById('submitTo');

  podcastDropdown.addEventListener('change', function () {
    if (podcastDropdown.value === 'Cum Town') {
      // Check Stav's checkbox and show button if Cum Town is selected
      stavCheckbox.checked = true;
      stavButton.classList.remove('disabled');

      // Add Stav to the submitTo buttons if not already present
      if (!submitToButtonGroup.querySelector('input[value="Stav"]')) {
        const stavSubmitButton = document.createElement('input');
        stavSubmitButton.type = 'submit';
        stavSubmitButton.name = 'go';
        stavSubmitButton.value = 'Stav';
        stavSubmitButton.className = 'btn btn-outline-dark btn-sm';
        submitToButtonGroup.appendChild(stavSubmitButton);
      }
    } else if (podcastDropdown.value === 'The Adam Friedland Show') {
      // Uncheck Stav's checkbox and hide button if TAFS is selected
      stavCheckbox.checked = false;
      stavButton.classList.add('disabled');

      // Remove Stav from the submitTo buttons if present
      const stavSubmitButton = submitToButtonGroup.querySelector('input[value="Stav"]');
      if (stavSubmitButton) {
        submitToButtonGroup.removeChild(stavSubmitButton);
      }
    }
  });
});


// document.getElementById('userInput').addEventListener('input', toggleResponseContainer);


// document.getElementById('ttsButton').addEventListener('click', function() {
//   var icon = document.getElementById('ttsIcon');
//   if (icon.classList.contains('fa-volume-up')) {
//     console.log('Voice is OFF');
//     icon.classList.replace('fa-volume-up', 'fa-volume-mute'); // Change to muted icon
//     // Perform actions to disable the voice feature
//   } else {
//     console.log('Voice is ON');
//     icon.classList.replace('fa-volume-mute', 'fa-volume-up'); // Change to high volume icon
//     // Perform actions to enable the voice feature
//   }
// });







// document.getElementById('addButton').addEventListener('click', addButton);

// function toggleCollapsible() {
//   const collapsible = document.querySelector('.collapsible');
//   const toggleIcon = document.getElementById('toggleIcon');
//   const inputField = document.getElementById('buttonName');
// }

// document.getElementById('toggleButton').addEventListener('click', toggleCollapsible);
// function toggleSettingsModal() {
//   var modal = document.getElementById("settingsModal");
//   if (modal.style.display === "none" || modal.style.display === "") {
//     modal.style.display = "block";
//   } else {
//     modal.style.display = "none";
//   }
// }

// Function to check if the bot image and the text overlap and adjust opacity
// function checkOverlap() {
//   const svgElement = document.getElementById("botImage");
//   // const textElement = document.getElementById("botResponse");
//   const svgRect = svgElement.getBoundingClientRect();
//   const textRect = textElement.getBoundingClientRect();
//   const overlap = !(svgRect.right < textRect.left || svgRect.left > textRect.right || svgRect.bottom < textRect.top || svgRect.top > textRect.bottom);
//   svgElement.style.opacity = overlap ? 0.5 : 1;


//   const responseContainer = document.getElementById('response-container');
//   const rect = responseContainer.getBoundingClientRect();

//   //   if (rect.top < 0 || rect.bottom > window.innerHeight) {
//   //     // If it is, then add the response-container-fixed class, and remove the response-container class
//   //     responseContainer.classList.add('response-container-fixed');
//   //     responseContainer.classList.remove('response-container');
//   //     console.log('Some part of botResponse is outside the viewport');
//   // } else if (rect.top > 0 || rect.bottom > window.innerHeight) {
//   //     // If responseContainer is fully visible AND it has the class response-container-fixed
//   //     // then remove the response-container-fixed class and add back the response-container class
//   //     responseContainer.classList.remove('response-container-fixed');
//   //     responseContainer.classList.add('response-container');
//   //     // console.log('botResponse is fully visible');
//   // }
// }

// function captureAndDownload() {
//   const element = document.getElementById('capture'); // The element you want to capture

//   html2canvas(element).then(canvas => {
//     canvas.toBlob(function(blob) {
//       // For downloading the image
//       let link = document.createElement('a');
//       link.download = 'screenshot.png';
//       link.href = URL.createObjectURL(blob);
//       link.click();
//       URL.revokeObjectURL(link.href);  // Recommended: Free up memory by revoking the Object URL after use.

//       // For dcopying the image to the clipboard
//       try {
//         const item = new ClipboardItem({ 'image/png': blob });
//         navigator.clipboard.write([item]).then(() => {
//           showCopyMessage();
//           console.log('Image copied to clipboard!');
//         });
//       } catch (error) {
//         console.error('Failed to copy image to clipboard', error);
//       }

//     }, 'image/png');
//   });
// }
// function showCopyMessage() {
//   const msg = document.getElementById('copyMessage');
//   msg.style.display = 'block';
//   setTimeout(() => {
//     msg.style.display = 'none';
//   }, 3000);  // Message will fade out after 3 seconds.
// }

// async function captureAndDownload() {
//   const element = document.getElementById('capture'); // The element you want to capture

//   try {
//     await html2canvas(element, { windowWidth: element.scrollWidth, windowHeight: element.scrollHeight });

//     const canvas = await html2canvas(element);
//     canvas.toBlob(function (blob) {
//       // For downloading the image
//       let link = document.createElement('a');
//       link.download = 'screenshot.png';
//       link.href = URL.createObjectURL(blob);
//       link.click();
//       URL.revokeObjectURL(link.href);  // Recommended: Free up memory by revoking the Object URL after use.

//       // For copying the image to the clipboard
//       try {
//         const item = new ClipboardItem({ 'image/png': blob });
//         navigator.clipboard.write([item]).then(() => {
//           showCopyMessage();
//           console.log('Image copied to clipboard!');
//         });
//       } catch (error) {
//         console.error('Failed to copy image to clipboard', error);
//       }
//     }, 'image/png');
//   } catch (error) {
//     console.error('Error capturing screenshot:', error);
//   }
// }

// async function captureAndShare() {
//   const element = document.getElementById('capture');
//   window.scrollTo(0, 0);

//   try {
//     await html2canvas(element, { windowWidth: element.scrollWidth, windowHeight: element.scrollHeight });

//     const canvas = await html2canvas(element);
//     canvas.toBlob(blob => {
//       const file = new File([blob], 'screenshot.png', { type: 'image/png' });

//       if (navigator.share) {
//         navigator.share({
//           title: 'My Screenshot',
//           text: 'Check out my screenshot!',
//           files: [file]
//         }).catch(error => console.error('Sharing failed:', error));
//       } else {
//         // Fallback
//         alert('Web Share API not supported in your browser.');
//       }
//     });
//   } catch (error) {
//     console.error('Error capturing screenshot:', error);
//   }
// }


// Event listener to run checkOverlap function when the window resizes
// window.addEventListener("resize", checkOverlap);
// Functions to toggle and close settings modal


//// Event listener to close the settings modal if clicked outside of it
// window.onclick = function (event) {
//   const modal = document.getElementById("settingsModal");
//   if (event.target == modal) {
//     modal.style.display = "none";
//   }
// }

// document.addEventListener("DOMContentLoaded", function () {
//   // Get references to the dropdown and the buttons
//   var dropdown = document.getElementById('submitAs');
//   var buttons = document.querySelectorAll('input[type="submit"][name="go"]');

//   // Function to hide the button that matches the dropdown value
//   function hideMatchingButton() {
//     // Get the selected value from the dropdown
//     var selectedValue = dropdown.value;

//     // Loop through each button
//     buttons.forEach(function (button) {
//       // If the button's value matches the selected dropdown value, hide it. Otherwise, show it.
//       if (button.value === selectedValue) {
//         button.style.display = 'none';
//       } else {
//         button.style.display = 'inline-block';
//       }
//     });
//   }

//   // Call the function initially
//   hideMatchingButton();

//   // Attach the function to the change event of the dropdown
//   dropdown.addEventListener('change', hideMatchingButton);
// });

// window.onload = function() {
// // Set the userInput value
// const userInputElem = document.getElementById('userInput');
// userInputElem.value = 'Greet Nick and Adam. Dont Laugh';

// // Call askBot function without passing an event object
// askBot();
// };