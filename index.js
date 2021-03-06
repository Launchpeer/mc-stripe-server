const Stripe = require('stripe');
const random = require('randomstring');

/**
 * This library only supports USD at the moment.
 */
class StripeInterface {
  constructor(stripeAPIKey) {
    this.api = require('stripe')(stripeAPIKey);
  }

  findStripeConnect(connectId) {
    return new Promise((resolve, reject) => {
      this.api.accounts.retrieve(connectId, (err, account) => {
        if (err) { return reject(err); }
        return resolve(account);
      });
    });
  }

  createCustomer(userId, token) {
    return new Promise((resolve, reject) => {
      this.api.customers.create({
        description: `Customer ${userId}`,
        source: token
      }, function(err, customer) {
        if(err) return reject(err);
        return resolve(customer);
      });
    });
  }

  findCustomer(customerId) {
    return new Promise((resolve, reject) => {
      this.api.customers.retrieve(customerId, (err, customer) => {
        if(err) return reject(err);
        return resolve(customer);
      });
    });
  }

  deleteCustomer(customerId) {
    return new Promise((resolve, reject) => {
      this.api.customers.del(customerId, (err, confirmation) => {
        if(err) return reject(err);
        return resolve(confirmation);
      });
    });
  }

  findSubscription(subscriptionId) {
    return new Promise((resolve, reject) => {
      this.api.subscriptions.retrieve(subscriptionId, (err, subscription) => {
        if(err) return reject(err);
        return resolve(subscription);
      });
    });
  }

  createSubscription(customerId, planId, quantity, coupon) {
    return new Promise((resolve, reject) => {
      if(quantity <= 0){
        let err = new Error('quanitity must be greater than 0');
        return reject(err);
      }
      this.api.subscriptions.create({
        customer: customerId,
        plan: planId,
        quantity: quantity,
        coupon: coupon
      }, (err, subscription) => {
        if(err) return reject(err);
        return resolve(subscription);
      });
    });
  }

  findCoupon(couponId) {
  return new Promise((resolve, reject) => {
    this.api.coupons.retrieve(couponId, (err, coupon) => {
      if(err) return reject(err);
      return resolve(coupon);
    });
  });
}

findAllCoupons() {
  return new Promise((resolve, reject) => {
    this.api.coupons.list({ limit: 10 }, (err, coupons) => {
      if(err) return reject(err);
      return resolve(coupons);
    });
  });
}

  updateCustomer(customerId, token) {
    return new Promise((resolve, reject) => {
      this.api.customers.update(customerId, {
        source: token
      }, (err, customer) => {
        if (err) return reject(err);
        return resolve(customer);
      });
    });
  }

  updateSubscription(subscriptionId, quantity) {
    return new Promise((resolve, reject) => {
      if(quantity <= 0){
        let err = new Error('Quantity must be greater than 0');
        return reject(err);
      }
      this.api.subscriptions.update(subscriptionId, {
        quantity: quantity
      }, (err, subscription) => {
        if(err) return reject(err);
        return resolve(subscription);
      });
    });
  }

  removeSubscription(subscriptionId) {
    return new Promise((resolve, reject) => {
      this.api.subscriptions.del(subscriptionId, (err, confirmation) => {
        if(err) return reject(err);
        return resolve(confirmation);
      });
    });
  }
  /**
   * Gets the subscriptions statuses. Returns an array of objects with subscription id as key and its status.
   * @param {String} subscriptionId
   */
  subscriptionStatus(subscriptionId) {
    return new Promise((resolve, reject) => {
      this.api.subscriptions.retrieve(subscriptionId, (err, subscription) => {
        if(err) return reject(err);
        if(!subscription.status) {
          let err = new Error('Issue occurred while retrieving the subscription');
          return reject(err);
        }
        return resolve({status: subscription.status});
      });
    });
  }

  // Customer Card Functionality
  /**
   * Retrive all customer cards limit 100
   * @param {String} customerId Stripe customer ID
   */
  getCustomerCards(customerId) {
    return new Promise((resolve, reject) => {
      this.api.customers.listCards(customerId, (err, cards) => {
        if(err) return reject(err);
        return resolve(cards);
      });
    });
  }
  /**
   * Deletes a specific on file card from stripe customer
   * @param {String} cardId Stripe card id
   * @param {String} customerId Stripe customer id
   */
  deleteCustomerCard(cardId, customerId) {
    return new Promise((resolve, reject) => {
      this.api.customers.deleteCard(customerId, cardId, (err, confirmation) => {
        if(err) return reject(err);
        return resolve(confirmation);
      });
    });
  }
  /**
   * Updates a specific customer card.  All cardObj values are optional.
   * @param {String} customerId
   * @param {String} cardId
   * @param {{address_city:string, address_country:string, address_line1:string, address_line2:string, address_state:string, address_zip:string, exp_month:number, exp_year:number, name:string}} cardObj
   */
  updateCustomerCard(customerId, cardId, cardObj) {
    return new Promise((resolve, reject) => {
      this.api.customers.updateCard(customerId, cardId, cardObj, (err, card) => {
        if(err) return reject(err);
        return resolve(card);
      });
    });
  }

  createCustomerCard(customerId, token) {
    return new Promise((resolve, reject) => {
      this.api.customers.createSource(customerId, {
        source: token
      }, (err, card) => {
        if(err) return reject(err);
        return resolve(card);
      });
    });
  }

  // Customer Invoicing retrieval
  getInvoices(customerId, startAfterObjectId = null) {
    return new Promise((resolve, reject) => {
      this.api.invoices.list({ limit: 100, customer: customerId }, (err, invoices) => {
        if(err) return reject(err);
        return resolve(invoices);
      });
    });
  }

  getUpcomingInvoices(customerId) {
    return new Promise((resolve, reject) => {
      this.api.invoices.retrieveUpcoming(customerId, (err, upcoming) => {
        if(err) return reject(err);
        return resolve(upcoming);
      });
    });
  }

  // Create new Plan objects
  /**
   * Creates a custom plan that will be billed at the interval scale and interval frequency. Default currency is USD.
   * @param {String} name human readable name for plan.
   * @param {Number} amount amount in cents
   * @param {String} interval payment charge interval either year, month, day or week
   * @param {Number} intervalCount frequency the charge will be made based on the interval.  Example: interval = month interval count = 3 bills every 3 months.
   */
  createPlan(name, amount, interval, intervalCount) {
    return new Promise((resolve, reject) => {
      let allowedIntervalTypes = ['year', 'month', 'day', 'week'];
      if(!allowedIntervalTypes.includes(interval)) {
        let err = new Error('interval must be year, month, day, or week');
        return reject(err);
      }
      if(amount <= 0) {
        let err = new Error('amount must be greater than 0');
        return reject(err);
      }
      this.api.plans.create({
        amount: amount,
        interval: interval,
        name: name,
        currency: 'usd',
        id: random.generate({length: 12})
      }, (err, plan) => {
        if(err) return reject(err);
        return resolve(plan);
      });
    });
  }

  deletePlan(planId) {
    return new Promise((resolve, reject) => {
      this.api.plans.del(planId, (err, confirmation) => {
        if(err) return reject(err);
        return resolve(confirmation);
      });
    });
  }

  listPlans(startingAfterPlanId = undefined) {
    return new Promise((resolve, reject) => {
      var query = {limit: 100}
      if(startingAfterPlanId) {
        query.starting_after = startingAfterPlanId;
      }
      this.api.plans.list(query, (err, plans) => {
        if(err) return reject(err);
        return resolve(plans);
      });
    });
  }

  getPlan(id) {
    return new Promise((resolve, reject) => {
      this.api.plans.retrieve(id, (err, plan) => {
        if(err) return reject(err);
        return resolve(plan);
      });
    });
  }

  /**
   *
   * @param {String} id
   * @param {{metadata:Object, name:String, statement_descriptor:String}} options
   */
  updatePlan(id, options) {
    return new Promise((resolve, reject) => {
      this.api.plans.update(id, options, (err, plan) => {
        if(err) return reject(err);
        return resolve(plan);
      });
    });
  }
}

module.exports = StripeInterface;
