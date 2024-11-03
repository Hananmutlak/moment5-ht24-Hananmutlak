"use strict";

// Dölja valfria element som inte behövs
document.getElementById("player").style.display = "none"; // Radera denna rad för att visa musikspelare
document.getElementById("shownumrows").style.display = "none"; // Radera denna rad för att visa antal träffar

// Constants till API 
const API_BASE = 'https://api.sr.se/api/v2';
const CHANNELSAPI = `${API_BASE}/channels`; // Corrected template literal
const SCHEDULEAPI = `${API_BASE}/scheduledepisodes`; // Corrected template literal

// HTML elements
const mymainNavList = document.getElementById('mainnavlist');
const mynumrowsEl = document.getElementById('numrows'); // Referens till vårt nya input-element
const myinfo = document.getElementById('info');

// Skapa hjärta element
const heart = document.createElement('div');
heart.textContent = '❤️'; // Heart symbol
heart.style.position = 'fixed'; // Fix position on the screen
heart.style.top = '10px'; // Position from the top
heart.style.right = '10px'; // Position from the right
heart.style.fontSize = '24px'; // Adjust size
heart.style.zIndex = '1000'; // Ensure it's on top
document.body.appendChild(heart); // Add heart to the body

// Event listeners
mynumrowsEl.addEventListener('input', loadChannels); 

// Load channel från API
async function loadChannels() {
    console.log("Laddar kanaler med max antal:", mynumrowsEl.value);
    try {
        const maxChannel = mynumrowsEl.value || 10; // Hämta värdet från input element
        const response = await fetch(`${CHANNELSAPI}?page=1&size=${maxChannel}&format=json`); // Corrected template literal
        const data = await response.json();
        console.log("Kanaler hämtade:", data.channels);
        displayChannels(data.channels);
    } catch (error) {
        console.error('Fel vid laddning av kanaler:', error);
        myinfo.innerHTML = "Det gick inte att ladda kanaler. Vänligen försök igen.";
    }
}

// Visa kanaler i navigeringslistan
function displayChannels(channels) {
    mymainNavList.innerHTML = ''; 
    console.log("Visar", channels.length, "kanaler.");

    channels.forEach(channel => {
        const listItem = document.createElement('li');
        listItem.textContent = channel.name;
        listItem.setAttribute('title', channel.details);
        listItem.setAttribute('data-channel-id', channel.id);

        // Händelselyssnare för att klicka på en kanal
        listItem.addEventListener('click', async () => {
            myinfo.innerHTML = ''; // nu rensa tidigare kanals schema från info section
            console.log("Vald kanal ID:", channel.id);
            await loadFullSchedule(channel.id); // Ladda schemat för den valda kanalen
        });

        mymainNavList.appendChild(listItem);
    });
}

// Visa kanalinformation
function displayChannelInformation() {
    const informArticle = document.createElement('article');
    informArticle.innerHTML = `
        <h3>Välkommen till tablåer för Sveriges Radio</h3>
        <h4>Detaljer om varje kanal</h4>
        <p>Denna webbapplikation använder Sveriges Radios Öppna API för tablåer. 
           Välj en kanal till vänster för att visa hela dagsprogrammet för den kanalen.</p>
    `;
    myinfo.appendChild(informArticle);
}

// Analysera datumformat från Sveriges Radio API
function parseDate(DateString) {
    const timestamp = DateString.match(/\d+/)[0];
    return new Date(parseInt(timestamp, 10));
}

// Ladda hela schemat för den valda kanalen för den aktuella dagen
async function loadFullSchedule(channelId) {
    const today = new Date().toISOString().split('T')[0]; // Få aktuellt datum
    let page = 1;
    let allPrograms = [];

    // Loop för att hantera alla sidor med schemadata
    while (true) {
        try {
            const response = await fetch(`${SCHEDULEAPI}?channelid=${channelId}&date=${today}&page=${page}&format=json`); // Corrected template literal
            const data = await response.json();
            console.log(`Hämtad schema för kanal ID ${channelId}, sida ${page}:`, data.schedule); // Corrected template literal
            
            if (data.schedule && data.schedule.length > 0) {
                allPrograms = allPrograms.concat(data.schedule);
            } else {
                break; // Avsluta loop om inga fler program
            }

            if (!data.pagination || !data.pagination.nextpage) {
                break; // Avsluta loopen om det inte finns någon nästa sida
            }
            page++; // Flytta till nästa sida
        } catch (error) {
            console.error('Fel vid hämtning av schema:', error);
            myinfo.innerHTML = "Det gick inte att hämta schemat. Vänligen försök igen.";
            break;
        }
    }

    console.log("Totalt hämtade program:", allPrograms.length);
    displaySchedule(allPrograms); // Visa alla program för den valda kanalen
}

// Visa aktuellt program 
function displaySchedule(schedule) {
    myinfo.innerHTML = ''; // Rensa befintligt schema för en nystart

    const aktuelltTid = new Date(); // hämta date

    // Skapa en uppsättning för att spåra unika program
    let seenPrograms = new Set();

    schedule.forEach(program => {
        const startTime = parseDate(program.starttimeutc);

        // Hoppa över programmet om det redan har avslutats
        if (startTime <= aktuelltTid) {
            return;
        }

        const showkey = `${program.title}-${program.starttimeutc}`; // Corrected template literal

        if (seenPrograms.has(showkey)) {
            return;
        }
        
        seenPrograms.add(showkey); // Spåra unika program

        const article = document.createElement('article');
        const title = document.createElement('h3');
        title.textContent = program.title;

        const showtitle = document.createElement('h4');
        showtitle.textContent = program.showtitle || '';

        const klock = document.createElement('h5');
        const formattedStartTime = startTime.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        const endTime = parseDate(program.endtimeutc).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
        klock.textContent = `${formattedStartTime} - ${endTime}`; // Corrected template literal

        const date = startTime.toLocaleDateString('sv-SE');
        const dateEl = document.createElement('p');
        dateEl.textContent = `Datum: ${date}`; // Corrected template literal

        const description = document.createElement('p');
        description.textContent = program.description || 'Ingen beskrivning tillgänglig.';

        article.appendChild(title);
        article.appendChild(showtitle);
        article.appendChild(klock);
        article.appendChild(dateEl);
        article.appendChild(description);

        myinfo.appendChild(article);
    });

    console.log("Visade program:", myinfo.children.length);
}

// Initial load
displayChannelInformation(); // Display channel information when the page loads
loadChannels(); // Load channels initially
