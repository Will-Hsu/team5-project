/*
 * Firebase initializations
 */



var ui = new firebaseui.auth.AuthUI(firebase.auth());

// TODO Madhav, Xianhai
// update this config to make sure all outcomes are handles
// - successful login
// - account creation
// - incorrect credentials
// - invalid parameters (blank email/pass)
const uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      console.log(authResult);
      document.getElementById('firebaseui-auth-container').style.display = 'none';
      document.getElementById('result-email').innerHTML = "Logged in as: " + authResult.user.email;
      document.getElementById('result-uid').innerHTML = "uid: " + authResult.user.uid;
      return true;
    },
  },

  signInFlow: 'popup',

  signInOptions: [
    {
      provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
    },
    {
      provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      authMethod: 'https://accounts.google.com',
    },
  ]
}

ui.start('#firebaseui-auth-container', uiConfig);


/*
 * Client side functions
 */


function compareTime(a, b) {
  return b[1].time - a[1].time;
}

async function getDomains() {
  const db = firebase.firestore();
  // TODO (Madhav, Xianhai) 
  // Update for the logged in user
  //
  // Instead of 'user_0', use the uid of the currently logged in user.
  // In addition, add a check at the beggining of this function, returning
  // if there is no logged in user
  //
  // NOTE: use firebase.auth().currentUser.uid as the identifier
  const user = db.collection('users').doc('user_0');

  userData = await user.get();

  return userData.data();
}

const updateProductivity = () => {
  //TODO calculate productivity with an API instead of dummy values
  chrome.storage.sync.get('productivity', (data) => {
    console.log(data);
    if (Object.keys(data).length === 0 || data.productivity < 0) {
      document.getElementById('p_score').innerHTML = "N/A";
    }
    else {
      document.getElementById('p_score').innerHTML = data.productivity + "%";
    }
  });
};
//connects popup.js to background.js
var port = chrome.extension.connect({
  name: "Sample Communication"
});

// loads domain from background.js if we get one, otherwise does a backup query
port.onMessage.addListener(function(msg) {
  console.log("message:" +msg);
  // do backup query if msg was null
  if(msg == null){
    chrome.tabs.query({active: true, lastFocusedWindow: true}, tabs => {
      let url = tabs[0].url;
      // regex to split url from domain
      let matches = url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
      let domain = matches && matches[1];
      this.document.getElementById('domain').innerHTML = domain;
    });
  }
  else{
    //let matches = msg.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
    //let domain = matches && matches[1];
    this.document.getElementById('domain').innerHTML = msg;
  }
});

function sortDomains(data) {
  tempMap = new Map(Object.entries(data["domains"]));
  return [...tempMap.entries()].sort(compareTime);
}

function updateSites(sitesList) {
  sitesList.then(sitesList_ => {
    sortedDomains = sortDomains(sitesList_);

    console.log(sortedDomains);

    var MAX_SITES = 5;
    var numSites = sortedDomains.length < MAX_SITES ? sortedDomains.length : MAX_SITES;

    var list = document.createElement('ol');
    for (var i = 0; i < numSites; i++) {
      var item = document.createElement('li');
      item.appendChild(document.createTextNode(sortedDomains[i][0]));
      list.appendChild(item);
    };

    document.getElementById("topsites").innerHTML = "Top " + numSites + " visted sites";
    document.getElementById('sitesList').appendChild(list);
  });

}

chrome.browserAction.onClicked.addListener(updateSites(getDomains()));
window.onload = function() {
  getDomains();
  port.postMessage("load domain");
  updateProductivity();
};
