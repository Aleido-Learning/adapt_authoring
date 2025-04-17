// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var Backbone = require('backbone');
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var ContentCollection = require('core/collections/contentCollection');

  var AssetManagementPreviewView = OriginView.extend({

    tagName: 'div',

    className: 'asset-management-preview',

    events: {
      'click a.confirm-select-asset' : 'selectAsset',
      'click .asset-preview-edit-button': 'onEditButtonClicked',
      'click .asset-preview-delete-button': 'onDeleteButtonClicked',
      'click .asset-preview-restore-button': 'onRestoreButtonClicked',
      'click .asset-preview-replace-button': 'onReplaceButtonClicked'
    },

    preRender: function() {
      this.listenTo(this, 'remove', this.remove);
    },

    selectAsset: function (event) {
      event && event.preventDefault();

      var data = {eventToTrigger: 'assetModal:assetSelected', model: this.model};
      Origin.trigger('modal:passThrough', data);
    },

    onEditButtonClicked: function(event) {
      event.preventDefault();
      var assetId = this.model.get('_id');
      Origin.router.navigateTo('assetManagement/' + assetId + '/edit');
    },

    onReplaceButtonClicked: function(event) {
      event.preventDefault();
      var assetId = this.model.get('_id');
      Origin.router.navigateTo('assetManagement/' + assetId + '/replace');
    },

    onDeleteButtonClicked: function(event) {
      event.preventDefault();

      Origin.Notify.confirm({
        type: 'warning',
        text: Origin.l10n.t('app.assetconfirmdelete'),
        callback: _.bind(this.onDeleteConfirmed, this)
      });
    },

    onDeleteConfirmed: async function(confirmed) {
      var self = this;
      var permanentDelete = false;

      await $.ajax({
        url: 'api/asset/uses/' + self.model.get('_id'),
        type: 'GET',
        success: function(data) {
          try {
           let parsed = JSON.parse(data);
            console.log("✅ Parsed JSON:", parsed, parsed.courses.length, parsed.components.length);
            if(parsed.components.length === 0) permanentDelete = true;
          } catch (e) {
            console.error("Failed to parse JSON:", e);
          }

        },
        error: function(data) {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorrestoreasset', { message: data.message })
          });
        }
      });

      console.log(permanentDelete);
      
      // var _url = 'api/asset/trash/' + self.model.get('_id');
      // if (permanentDelete === true) _url = 'api/asset/delete/' + self.model.get('_id');

      // if (confirmed) {
      //   $.ajax({
      //     url: _url,
      //     type: 'PUT',
      //     success: function() {
      //       if (Origin.permissions.hasPermissions(["*"])) {
      //         self.model.set({_isDeleted: true});
      //       } else {
      //         self.model.trigger('destroy', self.model, self.model.collection);
      //       }
      //       if (permanentDelete === true) {
      //         Origin.trigger('assetManagement:assetPreviewView:permanentdelete');
      //       } else {
      //           Origin.trigger('assetManagement:assetPreviewView:delete');
      //       }
      //       self.remove();

      //        setTimeout(function() {
      //         Origin.router.navigateTo('dashboard');
      //         setTimeout(function() {
      //           Origin.router.navigateTo('assetManagement');
      //         }, 100);
      //        }, 100);
      //     }
      //   });
      // }
    },

    onRestoreButtonClicked: function(event) {
      event.preventDefault();

      event.preventDefault();

      Origin.Notify.confirm({
        text: Origin.l10n.t('app.assetconfirmrestore'),
        callback: _.bind(this.onRestoreConfirmed, this)
      });
    },

    onRestoreConfirmed: function(confirmed) {
      var self = this;

      if (confirmed) {
        $.ajax({
          url: 'api/asset/restore/' + self.model.get('_id'),
          type: 'PUT',
          success: function() {
            self.model.set({_isDeleted: false});
            Origin.trigger('assetManagement:assetPreviewView:delete');
            self.remove();
          },
          error: function(data) {
            Origin.Notify.alert({
              type: 'error',
              text: Origin.l10n.t('app.errorrestoreasset', { message: data.message })
            });
          }
        });
      }
    }

  }, {
    template: 'assetManagementPreview'
  });

  return AssetManagementPreviewView;

});
