// script.js
let currentFilter = 'pending'

const sheetID = '1mQju2Y7i7KeLNqnK3HgkXneRZDAjmkspylH7waz0knk';
const sheetName = 'Form Responses 1!A:G';
const apiKey = 'AIzaSyAhxJ0SO0hHaSrqhWVIgx6Bn8l4z1hZvZA';

//https://console.cloud.google.com/welcome/new?pli=1&inv=1&invt=Ab0Scg

// Splash screen
window.onload = () => {
    setTimeout(() => {
        document.getElementById('splash-screen').classList.add('hidden');
        document.getElementById('appointments-page').classList.remove('hidden');
        loadAppointments();

        // Move indicator to the default "All" button AFTER layout is ready
        setTimeout(() => {
            const defaultButton = document.querySelector('#appointment-filters button.active');
            if (defaultButton) moveIndicatorTo(defaultButton);
        }, 50); // Small delay ensures layout is calculated
    }, 2000); // splash delay
};


function capitalizeName(name) {
    return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

let allAppointments = [];

function loadAppointments() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetID}/values/${sheetName}?key=${apiKey}`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            const rows = data.values.slice(1); // skip headers
            allAppointments = rows.map((row, index) => ({
                id: index,
                name: capitalizeName(row[1]),
                date: row[2],
                time: row[3],
                contact: row[4],
                voucher: row[5],
                referral: row[6],
                status: 'pending',
                note: '',
                cancelReason: '',
                alarm: null,
            }));
            renderAppointments();
        });
}

// function renderAppointments(filter = 'all') {
//     const container = document.getElementById('appointments-list');
//     container.innerHTML = '';

//     let filtered = allAppointments;
//     if (filter === 'pending') {
//         filtered = filtered.filter(a => a.status === 'pending');
//     } else if (filter === 'completed') {
//         filtered = filtered.filter(a => a.status === 'completed');
//     } else if (filter === 'cancelled') {
//         filtered = filtered.filter(a => a.status === 'cancelled');
//     }


//     document.getElementById('counts').innerText =
//         `Pending: ${allAppointments.filter(a => a.status === 'pending').length} | Completed: ${allAppointments.filter(a => a.status === 'completed').length} | Cancelled: ${allAppointments.filter(a => a.status === 'cancelled').length} | Total: ${allAppointments.length}`;

//     filtered.forEach(app => {
//         const card = document.createElement('div');
//         card.className = `appointment-card ${app.status}`;
//         card.dataset.id = app.id;
//         // card.className = 'appointment-card';
//         card.innerHTML = `
//                 <h2>${app.name}</h2>
//                     <div class="appointment-details">   
//                             Date: <span>${app.date}</span> & Time: ${app.time}<br>
//                             Contact: ${app.contact}<br>
//                             Gift Voucher: ${app.voucher}<br>
//                             Found us via: ${app.referral}<br>
//                             Status: ${app.status}<br>
//                      </div>
//                 <textarea class="note-input" placeholder="Add note..." onchange="saveNote(${app.id}, this.value)">${app.note}</textarea><br>
//                 ${app.status === 'cancelled' ? `Reason: ${app.cancelReason}` : ''}
//                 ${app.status === 'pending' ? `
//                     <button class="statusbutton" onclick="markComplete(this)">Complete</button>
// <button class="statusbutton" onclick="cancelAppointment(this)">Cancel</button>
//                     <button class="statusbutton" onclick="setAlarm(${app.id})">Set Alarm</button>
//       ` : ''}
//     `;
//         container.appendChild(card);
//     });
// }

function renderAppointments(filter = 'all', clearContainer = true) {
    const container = document.getElementById('appointments-list');

    if (clearContainer) {
        container.innerHTML = '';
    }

    let filtered = allAppointments;
    if (filter === 'pending') {
        filtered = filtered.filter(a => a.status === 'pending');
    } else if (filter === 'completed') {
        filtered = filtered.filter(a => a.status === 'completed');
    } else if (filter === 'cancelled') {
        filtered = filtered.filter(a => a.status === 'cancelled');
    }

    // Only render cards that are not already in DOM
    filtered.forEach(app => {
        if (!container.querySelector(`.appointment-card[data-id="${app.id}"]`)) {
            const card = document.createElement('div');
            card.className = `appointment-card ${app.status} slide-in`;
            card.dataset.id = app.id;
            card.innerHTML = `
                <h2>${app.name}</h2>
                <div class="appointment-details">   
                    Date: <span>${app.date}</span> & Time: ${app.time}<br>
                    Contact: ${app.contact}<br>
                    Gift Voucher: ${app.voucher}<br>
                    Found us via: ${app.referral}<br>
                    Status: ${app.status}<br>
                </div>
                <textarea class="note-input" placeholder="Add note..." onchange="saveNote(${app.id}, this.value)">${app.note}</textarea><br>
                ${app.status === 'cancelled' ? `Reason: ${app.cancelReason}` : ''}
                ${app.status === 'pending' ? `
                    <button class="statusbutton" onclick="markComplete(this)">Complete</button>
                    <button class="statusbutton" onclick="cancelAppointment(this)">Cancel</button>
                    <button class="statusbutton" onclick="setAlarm(${app.id})">Set Alarm</button>
                ` : ''}
            `;
            container.appendChild(card);
            // Remove slide-in class after animation so it doesn't repeat
            card.addEventListener('animationend', () => card.classList.remove('slide-in'));
            requestAnimationFrame(() => {
                const cards = document.querySelectorAll('.appointment-card');
                cards.forEach(card => {
                    card.style.transform = '';
                    card.style.transition = '';
                });
            });
        }
    });

    updateCounts();
}


function updateCounts() {
    document.getElementById('counts').innerText =
        `Pending: ${allAppointments.filter(a => a.status === 'pending').length} | Completed: ${allAppointments.filter(a => a.status === 'completed').length} | Cancelled: ${allAppointments.filter(a => a.status === 'cancelled').length} | Total: ${allAppointments.length}`;
}

function filterAppointments(status) {
    currentFilter = status;
    renderAppointments(status);

    const buttons = document.querySelectorAll('#appointment-filters button');
    buttons.forEach(btn => btn.classList.remove('active'));
    const clickedButton = Array.from(buttons).find(btn =>
        btn.textContent.toLowerCase() === status
    );
    if (clickedButton) {
        clickedButton.classList.add('active');
        moveIndicatorTo(clickedButton);
    }
}



function markComplete(button) {
  const card = button.closest('.appointment-card');
  const id = parseInt(card.dataset.id);

  allAppointments[id].status = 'completed';

  card.classList.add('slide-out');

  // Call shift BEFORE removing card
  shiftCardsUp(card);

  card.addEventListener('transitionend', function handler(e) {
    if (e.propertyName === 'transform') {
      card.removeEventListener('transitionend', handler);
      renderAppointments(currentFilter);
    }
  });
}


function cancelAppointment(button) {
  const reason = prompt('Enter cancellation reason:');
  if (!reason) return;

  const card = button.closest('.appointment-card');
  const id = parseInt(card.dataset.id);

  allAppointments[id].status = 'cancelled';
  allAppointments[id].cancelReason = reason;

  card.classList.add('slide-out');

  // 👇 Smoothly shift up cards below the removed one
  shiftCardsUp(card);

  // 👇 Wait until the slide-out animation finishes
  card.addEventListener('transitionend', function handler(e) {
    if (e.propertyName === 'transform') {
      card.removeEventListener('transitionend', handler);
      renderAppointments(currentFilter);
    }
  });
}



function animateShiftUp(cards) {
  cards.forEach(card => {
    // Store current position
    const startRect = card.getBoundingClientRect();

    // Force reflow to ensure we have layout data
    card.style.transition = 'none';
    card.style.transform = 'none';

    // Wait for the DOM to update
    requestAnimationFrame(() => {
      const endRect = card.getBoundingClientRect();
      const deltaY = startRect.top - endRect.top;

      // Start from old position
      card.style.transform = `translateY(${deltaY}px)`;
      card.style.transition = 'transform 0.5s ease';

      // Animate to natural position
      requestAnimationFrame(() => {
        card.style.transform = '';
      });

      // Clean up after animation
      card.addEventListener('transitionend', function cleanup(e) {
        if (e.propertyName === 'transform') {
          card.style.transition = '';
          card.removeEventListener('transitionend', cleanup);
        }
      });
    });
  });
}



function shiftCardsUp(slidedOutCard) {
  const allCards = Array.from(document.querySelectorAll('.appointment-card'));
  const slidedIndex = allCards.indexOf(slidedOutCard);

  const cardsBelow = allCards.slice(slidedIndex + 1);

  cardsBelow.forEach((card, i) => {
    const initialTop = card.getBoundingClientRect().top;

    requestAnimationFrame(() => {
      const finalTop = card.getBoundingClientRect().top;
      const shiftY = initialTop - finalTop;

      card.style.transition = 'none';
      card.style.transform = `translateY(${shiftY}px)`;

      requestAnimationFrame(() => {
        // ⏱ Add a staggered delay
        card.style.transition = `transform 0.5s ease ${i * 90}ms`;
        card.style.transform = '';
      });

      card.addEventListener('transitionend', function handler(e) {
        if (e.propertyName === 'transform') {
          card.style.transition = '';
          card.removeEventListener('transitionend', handler);
        }
      });
    });
  });
}




function updateCounts() {
  document.getElementById('counts').innerText =
    `Pending: ${allAppointments.filter(a => a.status === 'pending').length} | ` +
    `Completed: ${allAppointments.filter(a => a.status === 'completed').length} | ` +
    `Cancelled: ${allAppointments.filter(a => a.status === 'cancelled').length} | ` +
    `Total: ${allAppointments.length}`;
}



function saveNote(id, note) {
    allAppointments[id].note = note;
}

function setAlarm(id) {
    const time = prompt('Set alarm (HH:MM format)');
    if (time) {
        allAppointments[id].alarm = time;
        alert(`Alarm set for ${allAppointments[id].name} at ${time}`);
    }
}

function moveIndicatorTo(button) {
    const indicator = document.querySelector('.active-indicator');
    const parent = document.querySelector('#appointment-filters');

    const buttonRect = button.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    const left = buttonRect.left - parentRect.left;
    const width = button.offsetWidth;

    indicator.style.left = `${left}px`;
    indicator.style.width = `${width}px`;
}




//flip
function getPositions() {
    const cards = Array.from(document.querySelectorAll('.appointment-card'));
    return cards.map(card => {
        const rect = card.getBoundingClientRect();
        return { id: card.dataset.id, top: rect.top };
    });
}

function playFlipAnimation(oldPositions) {
    const cards = Array.from(document.querySelectorAll('.appointment-card'));
    cards.forEach(card => {
        const oldPos = oldPositions.find(pos => pos.id === card.dataset.id);
        if (!oldPos) return;

        const newRect = card.getBoundingClientRect();
        const deltaY = oldPos.top - newRect.top;

        // Only animate if there's a position change
        if (deltaY !== 0) {
            // Invert - move element back to old position instantly
            card.style.transform = `translateY(${deltaY}px)`;

            // Trigger reflow to apply the transform before animating to zero
            card.offsetHeight;

            // Play - animate transform back to zero smoothly
            card.style.transition = 'transform 0.5s ease';
            card.style.transform = 'translateY(0)';

            // Clean up after animation
            card.addEventListener('transitionend', () => {
                card.style.transition = '';
                card.style.transform = '';
            }, { once: true });
        }
    });
}
