/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Redirect the user to the best suitable OAuth flow.
 * If email parameter is available, it will check to see if an
 * an account associated with it and navigate to signin/signup page.
 *
 * @module views/oauth_index
 */
define(function (require, exports, module) {
  'use strict';

  const IndexView = require('./index');

  class OAuthIndexView extends IndexView {
    afterRender () {
      // Attempt to get email address from relier
      const action = this.relier.get('action');
      const email = this.model.get('relierEmail');

      if (action === 'email') {
        // let's the router know to use the email-first signin/signup page
        this.notifier.trigger('email-first-flow');
        if (email) {
          return this.checkEmail(email);
        } else {
          // show the email-first template.
          return;
        }
      }

      return Promise.resolve().then(() => {
        if (! email) {
          // If no email in relier, choose navigation page based on
          // whether account is a default account.
          return;
        }

        // Attempt to get account status of email and navigate
        // to correct signin/signup page if exists.
        const account = this.user.initAccount({ email });
        return this.user.checkAccountEmailExists(account)
          .then(function (exists) {
            if (exists) {
              return 'oauth/signin';
            } else {
              return 'oauth/signup';
            }
          }, (err) => {
            // The error here is a throttling error or server error (500).
            // In either case, we don't want to stop the user from
            // navigating to a signup/signin page. Instead, we fallback
            // to choosing navigation page based on whether account is
            // a default account. Swallow and log error.
            this.logError(err);
          });
      }).then((url) => {
        if (! url) {
          if (this.user.getChooserAccount().isDefault()) {
            url = 'oauth/signup';
          } else {
            url = 'oauth/signin';
          }
        }

        this.replaceCurrentPage(url);
      });
    }
  }

  module.exports = OAuthIndexView;
});
