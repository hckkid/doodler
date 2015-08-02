/**
 * User
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 *
 */

module.exports = {

  schema: true,

  attributes: {

    given_id: {
      type: 'string',
      required: true,
      unique: true
    },

  	name: {
  		type: 'string',
  		required: true
  	},

    surname: {
      type: 'string'
    },

    address: {
      type: 'string'
    },

    city: {
      type: 'string'
    },

    state:{
      type: 'string'
    },

    postal_code: {
      type: 'int'
    },

    country: {
      type: 'string'
    },

    phone: {
      type: 'string'
    },

  	user_type: {
  		type: 'string',
      in:
        ['teacher','student','management']
      required: true
  	},

    organization: {
      type: 'string'
    },

  	email: {
  		type: 'email',
  		required: true,
  		unique: true
  	},

  	encryptedPassword: {
  		type: 'string'
  	},

    online: {
      type: 'boolean',
      defaultsTo: false
    },

    admin: {
      type: 'boolean',
      defaultsTo: false
    },

    toJSON: function() {
      var obj = this.toObject();
      delete obj.password;
      delete obj.confirmation;
      delete obj.encryptedPassword;
      delete obj._csrf;
      return obj;
    }

  },


  beforeValidation: function (values, next) {
    if (typeof values.admin !== 'undefined') {
      if (values.admin === 'unchecked') {
        values.admin = false;
      } else  if (values.admin[1] === 'on') {
        values.admin = true;
      }
    }
     next();
  },

  beforeCreate: function (values, next) {

    // This checks to make sure the password and password confirmation match before creating record
    if (!values.password || values.password != values.confirmation) {
      return next({err: ["Password doesn't match password confirmation."]});
    }

    require('bcrypt').hash(values.password, 10, function passwordEncrypted(err, encryptedPassword) {
      if (err) return next(err);
      values.encryptedPassword = encryptedPassword;
      // values.online= true;
      next();
    });
  }

};
