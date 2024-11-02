// Denna fil ska innehålla din lösning till uppgiften (moment 5).

/* Här under börjar du skriva din JavaScript-kod */
"use strict";

/*  Denna fil ska innehålla din lösning till uppgiften (moment 5). */

// Constants for API endpoints
const API_BASE = 'http://api.sr.se/api/v2';
const CHANNELS_API = `${API_BASE}/channels`;
const SCHEDULE_API = `${API_BASE}/scheduledepisodes`;

// Get references to HTML elements
const mainNavList = document.getElementById('mainnavlist'); // unordered list for channels
const info = document.getElementById('info'); // main content area for schedule
const numrowsEl = document.getElementById('numrows'); // select for number of channels
const playChannelSelect = document.getElementById('playchannel'); // select for playing channels
const playButton = document.getElementById('playbutton'); // button to play the selected channel
const audioContainer = document.getElementById('radioplayer'); // container for audio player

let currentChannelId = null; // Track the current channel ID

// Example IDs for P4 channels
const p4Channels = [
    { id: 223, name: "P4 Dalarna" },
    { id: 205, name: "P4 Gotland" },
    { id: 210, name: "P4 Gävleborg" },
    { id: 212, name: "P4 Göteborg" },
    { id: 220, name: "P4 Halland" },
    { id: 200, name: "P4 Jämtland" }
];

// Event listeners
numrowsEl.addEventListener('change', loadChannels);
playButton.addEventListener('click', playSelectedChannel);

// Load channels from the API
async function loadChannels() {
    try {
        const maxChannels = numrowsEl.value || 10; // Get selected number of channels
        const response = await fetch(`${CHANNELS_API}?page=1&size=${maxChannels}&format=json`);
        const data = await response.json();
        displayChannels(data.channels);
    } catch (error) {
        console.error('Error fetching channels:', error);
    }
}

// Display channels in the navigation list
function displayChannels(channels) {
    mainNavList.innerHTML = ''; // Clear existing channels
    playChannelSelect.innerHTML = ''; // Clear existing options in the dropdown

    channels.forEach(channel => {
        const listItem = document.createElement('li');
        listItem.textContent = channel.name;
        listItem.setAttribute('title', channel.tagline);
        listItem.setAttribute('data-channel-id', channel.id);

        // Event listener for clicking on a channel
        listItem.addEventListener('click', async () => {
            if (currentChannelId !== channel.id) { // Check if the channel is already selected
                currentChannelId = channel.id; // Update the current channel ID
                info.innerHTML = ''; // Clear previous channel's schedule from the info section

                await loadFullSchedule(channel.id); // Load the schedule for the selected channel

                playChannelSelect.value = channel.id; // Update dropdown to selected channel
            }
        });

        mainNavList.appendChild(listItem);

        // Add channel to play selection dropdown
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = channel.name;
        playChannelSelect.appendChild(option);
    });
}

// Display channel information
function displayChannelInfo() {
    const infoArticle = document.createElement('article');
    infoArticle.innerHTML = `
        <h3>Välkommen till tablåer för Sveriges Radio</h3>
        <h4>Detaljer om varje kanal</h4>
        <p>Denna webbapplikation använder Sveriges Radios Öppna API för tablåer. 
           Välj en kanal till vänster för att visa hela dagsprogrammet för den kanalen.</p>
    `;
    info.appendChild(infoArticle);
}

// Parse date format from Sveriges Radio API
function parseDate(srDateString) {
    const timestamp = srDateString.match(/\d+/)[0];
    return new Date(parseInt(timestamp, 10));
}

// Load the full schedule for the selected channel for the current day
async function loadFullSchedule(channelId) {
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    let page = 1;
    let allPrograms = [];

    // Loop to handle pagination and gather all pages of schedule data
    while (true) {
        try {
            const response = await fetch(`${SCHEDULE_API}?channelid=${channelId}&date=${today}&page=${page}&format=json`);
            const data = await response.json();
            
            // Check if the API response has programs
            if (data.schedule && data.schedule.length > 0) {
                allPrograms = allPrograms.concat(data.schedule);
            } else {
                break; // Exit loop if there's no more schedule data
            }

            if (!data.pagination || !data.pagination.nextpage) {
                break; // Exit loop if there's no next page
            }
            page++; // Move to the next page
        } catch (error) {
            console.error('Error fetching schedule:', error);
            break;
        }
    }

    // Display only the upcoming programs for the selected channel
    displayUpcomingPrograms(allPrograms);
}

// Filter and display only upcoming programs
function displayUpcomingPrograms(schedule) {
    info.innerHTML = ''; // Clear existing schedule for a fresh start

    const currentTime = new Date(); // Get current time

    // Filter and display only upcoming programs
    schedule.forEach(program => {
        const startTime = parseDate(program.starttimeutc);
        if (startTime > currentTime) { // Check if the program starts in the future
            const article = document.createElement('article');

            const title = document.createElement('h3');
            title.textContent = program.title;

            const subtitle = document.createElement('h4');
            subtitle.textContent = program.subtitle || '';

            // Format and display the start and end time
            const timing = document.createElement('h5');
            const endTime = parseDate(program.endtimeutc).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
            timing.textContent = `${startTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })} - ${endTime}`;

            // Description paragraph
            const description = document.createElement('p');
            description.textContent = program.description || 'Ingen beskrivning tillgänglig.';

            // Append all elements to the article
            article.appendChild(title);
            article.appendChild(subtitle);
            article.appendChild(timing);
            article.appendChild(description);

            // Append the article to the info section
            info.appendChild(article);
        }
    });
}

// Function to display the audio player for the selected channel
async function displayAudioPlayer(channelId) {
    const response = await fetch(`${CHANNELS_API}/${channelId}?format=json`);
    const channelData = await response.json();

    const audioUrl = channelData.channel.liveaudio.url;

    // Clear existing audio elements
    audioContainer.innerHTML = '';

    if (audioUrl) {
        const audioElement = document.createElement('audio');
        audioElement.controls = true; // Show audio controls
        audioElement.autoplay = true; // Autoplay audio
        const sourceElement = document.createElement('source');
        sourceElement.src = audioUrl;
        sourceElement.type = 'audio/mpeg';

        audioElement.appendChild(sourceElement);
        audioContainer.appendChild(audioElement);
    } else {
        alert("Ingen ljudström tillgänglig för den här kanalen.");
    }
}

// Play the selected channel
async function playSelectedChannel() {
    const selectedChannelId = playChannelSelect.value;
    if (selectedChannelId) {
        displayAudioPlayer(selectedChannelId); // Display the audio player when a channel is selected
    } else {
        alert("Välj en kanal att spela.");
    }
}

// Function to display the heart symbol on the screen
function displayHeartSymbol() {
    const heartSymbol = document.createElement('div');
    heartSymbol.innerHTML = '❤️'; // Heart symbol
    heartSymbol.style.fontSize = '50px'; // Size of the heart symbol
    heartSymbol.style.position = 'fixed'; // Position fixed to screen
    heartSymbol.style.bottom = '10px'; // Position from the bottom
    heartSymbol.style.right = '10px'; // Position from the right
    heartSymbol.style.zIndex = '1000'; // Ensure it is on top
    document.body.appendChild(heartSymbol);
}

// Initial load
displayChannelInfo(); // Display channel information on load
loadChannels(); // Load channels initially
displayHeartSymbol(); // Display heart symbol on screen
