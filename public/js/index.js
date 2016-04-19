////////////////////////////////////////////////////////////////
// global data

var theContext = {};

////////////////////////////////////////////////////////////////
// startup
//
$(document).ready(function() {

  // retrieve the query params
  var theQuery = $.getQuery();

  // connect the button
  $("#element-list-docs").button().click(onListDocuments);
  $("#element-create-doc").button().click(onCreateDoc);
  $("#element-delete-doc").button().click(onDeleteDoc);

  // Hold onto the current session information
  theContext.documentId = theQuery.documentId;
  theContext.workspaceId = theQuery.workspaceId;
  theContext.elementId = theQuery.elementId;
  theContext.verison = 0;
  theContext.microversion = 0;

  refreshContextElements();
});

function onListDocuments() {
  $("#document-list").empty();
  $.ajax('/api/documents', {
    dataType: 'json',
    type: 'GET',
    success: function(data) {
      $("#document-list").append('Got ' + data.items.length + ' documents');
      $("#document-list").append('<br>&nbsp;&nbsp;&nbsp;<b>NOTE: Currently no pagination</b>');
    },
    error: function(data) {
      $("#document-list").append('Got error <pre>' + JSON.stringify(data, null, 2) + '</pre>');
    }
  });
}

function onCreateDoc() {
  $("#create-doc").empty();
  $("#create-doc").append('Checking for existing document...');
  $.ajax('/api/documents', {
    dataType: 'json',
    type: 'GET',
    success: function(data) {
      for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].name == 'QA Test Document') {
          $("#create-doc").append('<br>Already have QA Test Document (' + data.items[i].id + ')');
          return data.items[i];
        }
      }
      $("#create-doc").append('<br>Creating new QA Test Document...');
      return $.ajax('/api/newdoc' +
        "?name=QA+Test+Document",
        {
          dataType: 'json',
          type: 'GET',
          success: function(data) {
            $("#create-doc").append('<br>Created QA Test Document: (' + data.id + ')');
          },
          error: function(data) {
            $("#create-doc").append('<br>Got error creating doc: <pre>' + JSON.stringify(data, null, 2) + '</pre>');
          }
        });
    },
    error: function(data) {
      $("#create-doc").append('<br>Got error checking documents <pre>' + JSON.stringify(data, null, 2) + '</pre>');
    }
  });
}

function onDeleteDoc() {
  $("#delete-doc").empty();
  $("#delete-doc").append('Checking for existing element...');
  $.ajax('/api/documents', {
    dataType: 'json',
    type: 'GET',
    success: function(data) {
      for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].name == 'QA Test Document') {
          $("#delete-doc").append('<br>Found QA Test Document... deleting...');
          return $.ajax('/api/deldoc' +
            "?documentId=" + data.items[i].id,
            {
              dataType: 'json',
              type: 'GET',
              success: function() {
                $("#delete-doc").append('<br>Deleted QA Test Document');
              },
              error: function(data) {
                $("#delete-doc").append('<br>Got error deleting document: <pre>' + JSON.stringify(data, null, 2) + '</pre>');
              }
            });
        }
      }
      $("#delete-doc").append('<br>No QA Test Document to delete');
    },
    error: function(data) {
      $("#delete-doc").append('<br>Got error checking documents for deletion<pre>' + JSON.stringify(data, null, 2) + '</pre>');
    }
  });
}

// Send message to Onshape
function sendMessage(msgName) {
  var msg = {};
  msg['documentId'] = theContext.documentId;
  msg['workspaceId'] = theContext.workspaceId;
  msg['elementId'] =  theContext.elementId;
  msg['messageName'] = msgName;

  parent.postMessage(msg, '*');
}

//
// Check to see if a model has changed
function checkForChange(resolve, reject, elementId) {
  var params = "?documentId=" + theContext.documentId + "&workspaceId=" + theContext.workspaceId + "&elementId=" + elementId;

  $.ajax('/api/modelchange'+ params, {
    dataType: 'json',
    type: 'GET',
    success: function(data) {
      var objects = data;
      if (objects.change == true && Parts.length > 0) {
        // Show the message to say the QA may be invalid
        var e = document.getElementById("element-model-change-message");
        e.style.display = "initial";
      }
      resolve(1);
    },
    error: function(data) {
      reject(0);
    }
  });
}

//
// Tab is now shown
function onShow() {
  var listPromises = [];
  var selectedIndex = 0;

  // Check to see if any of the assemblies have changed, if so, let the user know
  $('#elt-select option').each(function(index,element){
    listPromises.push(new Promise(function(resolve, reject) { checkForChange(resolve, reject, element.value); }));

    if (element.value == theContext.elementId)
      selectedIndex = index;
  });

  return Promise.all(listPromises).then(function() {
    // Update the assembly list ... it may have changed.
    refreshContextElements(selectedIndex);
  });
}

function onHide() {
  // our tab is hidden
  // take appropriate action
}

function handlePostMessage(e) {
  if (e.data.messageName === 'show') {
    onShow();
  } else if (e.data.messageName === 'hide') {
    onHide();
  }
};

// keep Onshape alive if we have an active user
var keepaliveCounter = 5 * 60 * 1000;   // 5 minutes
var timeLastKeepaliveSent;
// User activity detected. Send keepalive if we haven't recently
function keepAlive() {
  var now = new Date().getTime();
  if (now > timeLastKeepaliveSent + keepaliveCounter) {
    sendKeepalive();
  }
}

// Send a keepalive message to Onshape
function sendKeepalive() {
  sendMessage('keepAlive');
  timeLastKeepaliveSent = new Date().getTime();
}

// First message to Onshape tells the Onshape client we can accept messages
function onDomLoaded() {
  // listen for messages from Onshape client
  window.addEventListener('message', handlePostMessage, false);
  timeLastKeepaliveSent = 0;
  document.onmousemove = keepAlive;
  document.onkeypress = keepAlive;
  sendKeepalive();
  return false;
}

// When we are loaded, start the Onshape client messageing
document.addEventListener("DOMContentLoaded", onDomLoaded);

//
// Simple alert infrasturcture
function displayAlert(message) {
  $("#alert_template span").remove();
  $("#alert_template button").after('<span>' + message + '<br></span>');
  $('#alert_template').fadeIn('slow');
  $('#alert_template .close').click(function(ee) {
    $("#alert_template").hide();
    $("#alert_template span").hide();
  });
}

//
// Update the list of elements in the context object
//
function refreshContextElements() {
  // First, show our session info
  $('#session-info').empty();
  $.ajax('/api/session', {
    dataType: 'json',
    type: 'GET',
    // cache: false,
    success: function(data) {
      if (data.email) {
        $('#session-info').append('<b>Got PII Data</b><br>');
      } else {
        $('#session-info').append('<b>*** No PII Data</b><br>');
      }
      $('#session-info').append('<pre>' + JSON.stringify(data, null, 2) + '</pre>');
    },
    error: function(data) {
      displayAlert('Error getting /api/session');
      $('#session-info').append('Error getting session info <pre>' + JSON.stringify(data, null, 2) + '</pre>');
    }
  });
}


