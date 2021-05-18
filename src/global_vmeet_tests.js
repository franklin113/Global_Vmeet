QUnit.module('tes', (hooks) => {
  let room_id = 'my_test_room';
  const saver = new chat_saver('https://cgcaci21.firebaseio.com', room_id);
  $('<input id="messageBox"/>').appendTo('#qunit-fixture');
  $('<button id="sendMessage"></button>').appendTo('#qunit-fixture');
  QUnit.test('testing the constructor', (assert) => {
    assert.equal(
      saver.database_url,
      'https://cgcaci21.firebaseio.com',
      'database url'
    );
    assert.equal(saver.room_id, room_id, 'room id');
    assert.equal(
      saver.chat_saver_url,
      'https://cgcaci21.firebaseio.com/saved_chats/' + room_id + '.json',
      'chat saver url'
    );
  });

  QUnit.test('testing the create message function', (assert) => {
    const message = saver.create_message('hello_world', 'tim franklin');
    assert.equal(message.text, 'hello_world', 'text');
    assert.deepEqual(message.timestamp, { '.sv': 'timestamp' }, 'timestamp');
    assert.equal(message.username, 'tim franklin', 'username');
  });

  // QUnit.test('testing the submit_via_button_listener function', (assert) => {
  //   const done = assert.async();
  //   $('<input id="messageBox"/>').appendTo('#qunit-fixture');
  //   // submit_via_keyboard_listener
  //   saver.submit_via_button_listener((res) => {
  //     assert;
  //   });
  // });

  QUnit.test('testing the keyboard event listener', (assert) => {
    const done = assert.async();

    $('#messageBox').val('hello_world');
    saver.submit_via_keyboard_listener((res) => {
      assert.equal(res, 'hello_world', 'simulated hitting the enter key');
      done();
    });
    var e = jQuery.Event('keydown');
    e.which = 13; // # Some key code value
    $('#messageBox').trigger(e);
  });

  QUnit.test(
    'testing the keyboard event listener while holding shift',
    (assert) => {
      const done = assert.async();
      $('#messageBox').val('hello_world');
      saver.submit_via_keyboard_listener((res) => {
        console.log();
        assert.equal(
          res,
          null,
          'simulated hitting the enter key whild holding shift'
        );
        done();
      });
      var e = jQuery.Event('keydown');
      e.which = 13; // # Some key code value
      e.shiftKey = true;
      $('#messageBox').trigger(e);
    }
  );

  QUnit.test('testing the submit_via_button_listener', (assert) => {
    const done = assert.async();

    $('#messageBox').val('hello_world');
    saver.submit_via_button_listener((res) => {
      assert.equal(
        res,
        'hello_world',
        'simulated hitting the submit button with the mouse'
      );
      done();
    });

    $('#sendMessage').click();
  });
});
