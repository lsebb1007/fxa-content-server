/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const AuthErrors = require('lib/auth-errors');
const Cocktail = require('cocktail');
const FormView = require('./form');
const SignInMixin = require('./mixins/signin-mixin');
const ServiceMixin = require('./mixins/service-mixin');
const Template = require('templates/sign_in_recovery_code.mustache');
const VerificationReasonMixin = require('./mixins/verification-reason-mixin');

const CODE_INPUT_SELECTOR = 'input.recovery-code';

const View = FormView.extend({
  className: 'sign-in-recovery-code',
  template: Template,

  beforeRender() {
    const account = this.getSignedInAccount();
    if (! account || ! account.get('sessionToken')) {
      this.navigate(this._getAuthPage());
    }
  },

  submit() {
    const account = this.getSignedInAccount();
    const code = this.getElementValue('input.recovery-code').toLowerCase();

    return account.consumeRecoveryCode(code)
      .then((result) => {
        if (result.remaining < 1) {
          // TODO Lets handle automatically generating recovery codes separately
        }

        this.logViewEvent('success');
        return this.invokeBrokerMethod('afterCompleteSignInWithCode', account);
      })
      .catch((err) => {
        if (AuthErrors.is(err, 'INVALID_PARAMETER')) {
          err = AuthErrors.toError('INVALID_RECOVERY_CODE');
        }
        this.showValidationError(this.$(CODE_INPUT_SELECTOR), err);
      });
  },

  /**
   * Get the URL of the page for users that
   * must enter their password.
   *
   * @returns {String}
   */
  _getAuthPage() {
    const authPage =
      this.model.get('lastPage') === 'force_auth' ? 'force_auth' : 'signin';

    return this.broker.transformLink(authPage);
  }
});

Cocktail.mixin(
  View,
  SignInMixin,
  ServiceMixin,
  VerificationReasonMixin
);

module.exports = View;
