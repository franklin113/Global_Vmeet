// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
  apiKey: 'AIzaSyDn-mwwnsd_NPDFqjImGXtwE8huKTw_SZ8',
  authDomain: 'cgmckesson.firebaseapp.com',
  databaseURL: 'https://mckessonpsasrxtsnsc2021.firebaseio.com/',
  projectId: 'cgmckesson',
  storageBucket: 'cgmckesson.appspot.com',
  messagingSenderId: '321351366968',
  appId: '1:321351366968:web:602292c7d00f72618269cd',
  measurementId: 'G-R03BPDPM00',
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const realtime_database = firebase.database();

const miro_utils = {
  miro_state_ref: realtime_database.ref(
    `miro_states/${window.location.pathname
      .split('/')
      .slice(-1)[0]
      .replace(/[.]/g, '_')}/enabled`
  ),
  miro_url: '',
  miro_state: false,
  add_fb_listener(db_ref, key, default_val) {
    let self = this;
    db_ref.on('value', function (snapshot) {
      let val = snapshot.val();
      if (val != null) {
        self[key] = val;
        self.toggle_miro_button(val);
        self.toggle_miro_board(val);
      } else {
        self[key] = val;
        self.toggle_miro_button(default_val);
        self.toggle_miro_board(default_val);
      }
    });
  },
  init_miro(miro_url) {
    this.miro_url = miro_url;
    //add miro
    this.add_miro_board();
    //add button
    this.add_miro_button();
    // add listener
    this.add_fb_listener(this.miro_state_ref, 'miro_state', false);
    // toggle button and board base on state
    this.add_miro_event_listener();
  },
  add_miro_board(miro_url) {
    //sample miro utrl -- https://miro.com/app/live-embed/o9J_lGnBSCo=/?moveToViewport=-789,-538,2046,1079
    const miro_template =
      /*html*/
      `
      <div class="miro-frame-container miro-disabled">
        <iframe id="miro-iframe" width="100%" height="auto" frameBorder="0" scrolling="no" allowFullScreen></iframe>
      </div>
    `;
    $(miro_template).prependTo('#app-video-container');
  },
  add_miro_button() {
    $(/*html*/ `
      <div title="Whiteboard toggle" class="control-button miro-button ${
        this.miro_state ? 'active' : ''
      }">
          <i class="fas fa-chalkboard"></i>
      </div>
    `).appendTo('#controls-wrapper');
  },
  add_miro_event_listener() {
    $('.miro-button').click((event) => {
      let target_ref = this.miro_state_ref;
      let new_state = !this.miro_state;
      target_ref.set(new_state);
    });
  },
  toggle_miro_button(state) {
    if (state) {
      $('.miro-button').addClass('active');
    } else {
      $('.miro-button').removeClass('active');
    }
  },
  toggle_miro_board(state) {
    if (state) {
      $('.miro-frame-container').addClass('miro-enabled');
      $('body').addClass('miro-enabled');
      $('.miro-frame-container').removeClass('miro-disabled');
      $('#miro-iframe').attr('src', this.miro_url);
    } else {
      $('.miro-frame-container').removeClass('miro-enabled');
      $('body').removeClass('miro-enabled');
      $('.miro-frame-container').addClass('miro-disabled');
      $('#miro-iframe').removeAttr('src');
    }
  },
};

function chat_saver(database_url, room_id, username) {
  this.username = username;
  this.room_id = room_id;
  this.database_url = database_url;
  this.chat_saver_url =
    database_url + '/saved_chats/' + this.room_id.toString() + '.json';

  this.submit_via_keyboard_listener = function (callback) {
    $('#messageBox').on('keydown', function (event) {
      var isEnter = event.which === 13 || event.keyCode === 13;
      if (!event.shiftKey && isEnter) {
        const message_text = event.target.value;
        setTimeout(() => {
          console.log('Custom Submit event');
          if (callback) {
            callback(message_text);
          }
        }, 1000);
      } else {
        callback(null);
      }
    });
  };
  this.submit_via_button_listener = function (callback) {
    console.log('hello');
    $('#sendMessage').click(function (event) {
      const message_text = $('#messageBox').val();
      setTimeout(() => {
        if (callback) {
          callback(message_text);
        }
      }, 1000);
    });
  };
  this.setup_listeners = function () {
    let self = this;

    setTimeout(() => {
      self.submit_via_keyboard_listener(this.save_message);
      self.submit_via_button_listener(this.save_message);
    }, 2000);
  };
  this.get_input_text = function () {};

  this.create_message = function (text) {
    return {
      text: text,
      timestamp: { '.sv': 'timestamp' },
      username: this.username,
    };
  };
  this.save_message = (message) => {
    if (message) {
      let new_message = this.create_message(message, username);
      axios.post(this.chat_saver_url, new_message).then((response) => {
        console.log('saved message', response);
      });
    }
  };
}

/**
 * Generic system for customizing vmeets
 * Uses a vmeet type map to call functions for particular types of vmeets.
 * for example, a vmeet url might contain 'bo' for breakout. This will call a
 * breakout callback
 */
function init_system() {
  /**
   * Add the url value and the callback to this map
   * the key needs to be in the url somewhere, the value is the function to call
   * We ALWAYS need to be ready for null and undefined values here.. always put in a try block
   */
  const vmeet_map = {
    // pf: init_ponvory_forum, // callback when we are in a breakout room
    // pasf: init_pas_forum,
    // kamf: init_kam_forum,
    // cvm: init_cvm,
  };

  // * Grab the last part of the url
  // * We will use this as the key in firebase
  let vmeet_url = window.location.pathname
    .split('/')
    .slice(-1)[0]
    .toLowerCase()
    .replace(/[.]/g, '_');

  /**
   * * this is the vmeet 'type'.. We use this to target a callback function
   */
  let split_vmeet_url = vmeet_url.split('_');
  let first_chunk_in_vmeet_name = split_vmeet_url.slice(0, 1);
  let vmeet_type = null;
  let firebase_target = vmeet_url;
  $(document).ready(() => {
    try {
      if (first_chunk_in_vmeet_name.length > 0) {
        vmeet_type = first_chunk_in_vmeet_name[0].toLowerCase();
        console.log('Vmeet TYpe first: ', vmeet_type);
        if (vmeet_type !== undefined) {
          // * add the vmeet type to the body
          $('body').addClass(vmeet_type + '_custom_vmeet');
        }
      }
    } catch (error) {
      console.log('Could not detect a vmeet type');
    }
    const user_data = get_user_data();
    /**
     * * Grab the data for this vmeet from firebase
     * * We'll always call the add slido function, inside of the funciton
     * * we'll do the test to see if it even as a slido
     */
    const firebase_url = `https://cgcaci21.firebaseio.com/vmeet_map/${firebase_target}/.json`;
    axios.get(firebase_url).then((res) => {
      try {
        console.log('data from firebase: ', res.data);
        if (res.data != null) {
          add_slido(res.data, user_data);
          add_titles(res.data);
          init_global_vmeet(res.data);
          if (res.data.whiteboard_url) {
            miro_utils.init_miro(res.data.whiteboard_url);
          }
        }
        console.log('vmeet type: ', vmeet_type);
        if (vmeet_type in vmeet_map) {
          vmeet_map[vmeet_type](res.data); // this accepts null data, so we need to handle null
        }
      } catch (error) {
        console.log('Could not find', error);
      }
    });
    // let sample_miro =
    //   "https://miro.com/app/live-embed/o9J_lGnBSCo=/?moveToViewport=-789,-538,2046,1079";
    init_pre_fb_vmeet();

    if (user_data.show_clicker) {
      add_clicker();
    }

    try {
      const vmeet_chat_saver = new chat_saver(
        'https://cgcaci21.firebaseio.com',
        vmeet_url,
        user_data.first_name + ' ' + user_data.last_name
      );
      vmeet_chat_saver.setup_listeners();
    } catch (error) {
      console.log(error);
    }
  });
}

const queryParams = new URLSearchParams(window.location.search);

init_system();

function init_global_vmeet() {
  console.log('______________ GLOBAL VMEET __________________');

  // * all random DOM stuff goes here
  let alterDOM = (() => {
    // $('#endCall').detach();
  })();
}

function init_pre_fb_vmeet() {
  console.log('______________ GLOBAL VMEET __________________');

  // * all random DOM stuff goes here
  let alterDOM = (() => {
    // $('#endCall').detach();
  })();
}

/**
 * * Get The user's data
 */
function get_user_data() {
  try {
    userCustomFields = JSON.parse(
      window.vc.eventAttendee.attendee_fields.additional_info
    );
    var user_email;
    if (userCustomFields.user_email) {
      userCustomFields.email = user_email;
    } else {
      userCustomFields.email = '';
    }
  } catch (error) {
    // we are probably in a public vmeet with no user data available
    userCustomFields = {};
  }
  console.log('user_data', userCustomFields);

  return userCustomFields;
}

/**
 *
 * @param {*} target button target
 * @param {*} display_name display name, if left null or undefined, defaults to "Back"
 * @param {*} template provide a template for the back button
 *  example template:
 */
function add_back_button(target, display_name, template) {
  console.log('Add back button ');
  // if (window.history.length === 1) return;
  let final_target;
  if (target) {
    final_target = `href="${target}"`;
  } else if (window.history.length > 1) {
    final_target = 'onclick="window.history.back()"';
  } else {
    console.log('Back Button is not possible here');
    return;
  }
  let final_display_name = 'Back';
  if (display_name) final_display_name = display_name;

  if (!template) {
    // * add a button container to the dom via text provided
    console.log('no template, adding text');
    let buttonTemplate = /*html*/ `
          <div id="reg-back-button" class="button-container">
            <button type="button" class="btn btn-primary" ${final_target}>${final_display_name}</button> 
          </div>
        `;
    console.log(buttonTemplate);
    $(buttonTemplate).prependTo('#controls'); // todo --- change the location where the buttons get appended to the dom
  } else {
    // * add a button container to the dom via a template
    console.log('adding template');

    const $backTemplate = $(/*html*/ `
          <div id="reg-back-button" class="button-container">
            <a type="button" class="btn btn-primary" ${final_target}></a> 
          </div>
        `);
    console.log('Back template being added');
    $backTemplate.prependTo('#controls'); // todo --- change the location where the buttons get appended to the dom
    $('#reg-back-button a').append(template);
  }
}

/**
 *
 * @param {Object} data data from firebase
 */
function add_slido(data, user_data) {
  console.log('___Add slido____', data);
  if (data === null) return false;
  const SLIDO_KEY = 'slido_url';
  const SLIDO_ID = data[SLIDO_KEY];
  if (SLIDO_ID) {
    let base_slido_url = `https://app.sli.do/event/${SLIDO_ID}`;
    let final_url =
      base_slido_url + `${base_slido_url.includes('?') ? '&' : '?'}`;
    let custom_username =
      window.vc.eventAttendee.attendee_fields.first_name +
      ' ' +
      window.vc.eventAttendee.attendee_fields.last_name;
    if (custom_username) {
      final_url += `&user_name=${custom_username}`;
    }
    if (user_data.email) {
      final_url += `&user_company=${user_data.email}`;
    }
    // * we have a slido for this vmeet
    let slido = $(
      `<div class="TestSlidoFrame"> <iframe src="${final_url}" height="100%" width="100%" style="min-height: 560px;"></iframe> </div>`
    );
    let alter_dom = () => {
      //* hide everything from the info tab before adding slido
      $('#info-tab *').hide();

      // * add the polls/info tab
      $('.nav-item_:first-child .nav-link').html(
        '<i class="fas fa-comment"></i>Chat'
      );

      // * add slido
      if ($('#info-tab').length > 0) {
        // $("#info-tab *").hide();
        $('#info-tab').append($(slido));
      }
      console.log('Slido embed: ', SLIDO_ID);
    };
    $('.control-button[title="Room info/chat"]').click((event) => {
      setTimeout(() => {
        if ($('#attendee-list').hasClass('active')) {
          $('.nav_ li:first-child').click();
        }
      }, 100);
    });
    let open_info_tab = () => {
      $('.control-button[title="Room info/chat"]').click();
      setTimeout(() => {
        $('.nav_ li:first-child').click();
      }, 100);
    };

    alter_dom();
    open_info_tab();
  } else {
    console.log('-- no slido found --');
  }
}

/**
 *
 * @param {Object} data data from firebase
 */
function add_titles(data) {
  /**
   * * this function will always be called- make sure we can handle
   * * data without titles and sub titles
   * * this should never actually fail, just display nothing
   */
  let vmeet_title_template =
    /*html*/
    `
      <div class="schedule-item-info custom-schedule-info">
        <div id="custom-schedule-item-name">${
          data.display_title ? data.display_title : ''
        }</div>
        <div id="custom-schedule-item-heading">${
          data.display_sub_title ? data.display_sub_title : ''
        }</div>
      </div>
      `;
  $(vmeet_title_template).insertAfter('.vmeet-logo');
}

function add_clicker() {
  const pp_clicker_template = /*html*/ `
      <div id="controller">
          <div class="control-container">
              <div class="button-wrapper">
                  <button class="btn clicker-button"
                      v-on:click="SlideBack" :class="backActive ? 'back' : ''"
                      v-on:keypress="SlideBack"><i class="fas fa-arrow-left"></i>
                  </button>
                  <button class="btn clicker-button"
                      v-on:click="SlideForward" :class="fwdActive ? 'forward' : ''"
                      v-on:keyup.right="ClickButton"><i class="fa fa-arrow-right" aria-hidden="true"></i>
                  </button>
              </div>
          </div>
      </div>`;

  $(document).ready(() => {
    $(pp_clicker_template).insertAfter('.main');

    function FB_KEYIFY(inputString) {
      return inputString.replace(/[\s\.#$]/g, '_');
    }
    const pp_clicker_vue = new Vue({
      el: '#controller',
      data: {
        fwd: 0,
        back: 0,
        meetingID: 'dev',
        curDirection: null,
      },
      methods: {
        ClickButton(e) {
          let cmd = e.key;
          let commands = {
            ArrowLeft: this.SlideBack,
            fwd: this.SlideBack,
            ArrowRight: this.SlideForward,
            back: this.SlideForward,
          };
          if (cmd in commands) {
            commands[cmd]();
          }
        },
        SlideForward() {
          let click = database.ref('/Session/' + this.meetingID);
          console.log('cur direction: ', this.curDirection);
          if (!this.curDirection) {
            console.log('setting direction: ', this.curDirection);
            click.update({
              key: 'fwd',
            });
            // this.curDirection = 'fwd'
            let self = this;
            setTimeout(function () {
              click.update({
                key: '',
              });
              self.curDirection = null;
            }, 1000);
          }
        },
        SlideBack() {
          console.log('cur direction: ', this.curDirection);

          let click = database.ref('/Session/' + this.meetingID);
          if (!this.curDirection) {
            console.log('setting direction: ', this.curDirection);
            click.update({
              key: 'back',
            });
            // this.curDirection = 'back'
            let self = this;
            setTimeout(function () {
              click.update({
                key: '',
              });
              self.curDirection = null;
            }, 1000);
          }
        },
      },
      computed: {
        fwdActive() {
          return this.curDirection === 'fwd';
        },
        backActive() {
          return this.curDirection === 'back';
        },
      },
      created() {
        window.addEventListener('keydown', this.ClickButton);
      },
      mounted() {
        this.meetingID = FB_KEYIFY(
          window.location.pathname.split('/').slice(-1)[0]
        );
        //   this.meetingID = "dev"
        let self = this;

        database
          .ref('/Session/' + this.meetingID + '/key')
          .on('value', function (snapshot) {
            self.curDirection = snapshot.val();
          });
      },
    });
  });
}

const rtdb = firebase.database();
$(document).ready(() => {
  /**
   * takes a message and saves it in firebase
   * @param {string} message_text
   */
});
