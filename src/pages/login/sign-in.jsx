var React = require('react/addons');
var api = require('../../lib/api');
var keyboard = require('../../lib/keyboard');

var FormInput = require('./form-input.jsx');
var Link = require('../../components/link/link.jsx');
var FormattedHTMLMessage = require('react-intl').FormattedHTMLMessage;
var FormattedMessage = require('react-intl').FormattedMessage;

// <SignIn />
// Component for the Sign in user form. See Login view for usage.
var SignIn = React.createClass({

  mixins: [
    React.addons.LinkedStateMixin,
    require('../../lib/validators'),
    require('react-intl').IntlMixin
  ],

  // Props:
  //   show
  //     boolean
  //     Shows the entire component if true, hides if false
  //   setParentState
  //     function(state)
  //     Calls setState on parent component (Login) given a state object.
  //     Useful for setting the loading or mode state of the Login view.
  //
  // FIXME: TODO: this function doesn't actually do anything. Remove?
  getDefaultProps: function () {
    return {};
  },

  // State:
  //   globalError
  //     string or boolean
  //     Indicates whether or not a an error was received from the server.
  //   username
  //   password
  //     string
  //     These store state for the form input fields
  getInitialState: function () {
    return {
      globalError: false
    };
  },

  // FIXME: TODO: move to statics?
  fields: [
    {
      name: 'username',
      label: 'username_email',
      type: 'email',
      tabIndex: 1,
      required: true
    },
    {
      name: 'password',
      label: 'password',
      type: 'password',
      tabIndex: 2,
      required: true,
      helpText: 'helpText'
    }
  ],

  // Called when the form is submitted
  // Triggers an api call via api.authenticate
  // If an error is received, sets state.globalError
  // If success:
  //    1. resets form
  //    2. caches user session in Android
  //    3. redirects to /main
  onSubmit: function (e) {
    e.preventDefault();

    this.setState({
      globalError: false
    });

    document.activeElement.blur();

    var errors = this.getValidationErrors();
    if (Object.keys(errors).length > 0) {
      return;
    }

    var json = {
      uid: this.state.username,
      password: this.state.password
    };

    this.props.setParentState({loading: true});
    api.authenticate({json}, (err, data) => {
      this.props.setParentState({loading: false});
      if (err) {
        if (window.Platform) {
          window.Platform.trackEvent('Login', 'Sign In', 'Sign In Error');
        }
        this.setState({globalError: err.message || 'Something went wrong.'});
        console.log(err);
        return;
      }

      this.replaceState(this.getInitialState());

      if (window.Platform) {
        window.Platform.trackEvent('Login', 'Sign In', 'Sign In Success');
        window.Platform.setUserSession(JSON.stringify(data));
        window.Platform.setView('/main');
      }
    });
  },

  // Hack to get the Android WebView to use the "done" button to "tab" to the
  // next form input by tabIndex
  onDoneEditing: function () {
    keyboard.focusNextInputByTabIndex();
  },

  // Changes parent mode (Login component) to show sign-up
  changeMode: function (e) {
    e.preventDefault();
    this.props.setParentState({mode: 'sign-up'});
  },

  onFormInputFocus: function (event) {
    this.setState({
      globalError: false
    });
  },

  render: function () {

    var errors = this.getValidationErrors();
    var isValid = Object.keys(errors).length === 0;
    var signinLink = (<a href="#" onClick={this.changeMode}>{this.getIntlMessage('join_webmaker')}</a>);

    return (
      <form hidden={!this.props.show} className="editor-options" onSubmit={this.onSubmit}>
        <h3>{this.getIntlMessage('signin_webmaker')}</h3>
        {this.fields.map(field => {
          return <FormInput {...field}
            key={field.name}
            onReturn={this.onDoneEditing}
            onFocus={this.onFormInputFocus}
            errors={errors[field.name]}
            valueLink={this.linkState(field.name)} />;
        })}
        <div>
          <button ref="submitButton" className="btn btn-block" disabled={!isValid} onClick={this.onSubmit}>
            {this.getIntlMessage('signin')}
          </button>
          <div className="error" hidden={!this.state.globalError}>
            {this.state.globalError}
          </div>
        </div>
        <div className="text-center text-larger">
          <FormattedMessage
            message={this.getIntlMessage('dont_have_account')}
            joinWebmakerLink={signinLink} />
        </div>
      </form>
    );
  }
});

module.exports = SignIn;
