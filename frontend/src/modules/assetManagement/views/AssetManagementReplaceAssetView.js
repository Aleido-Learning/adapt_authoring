// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){

  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var AssetManagementReplaceAssetView = OriginView.extend({


    className: 'asset-management-replace-asset',

    events: {
      
    },

    preRender: function() {
        this.listenTo(Origin, 'assetManagement:replaceAsset', this.replaceAsset);
    },

    postRender: function() {
      // Set view to ready
      this.setViewToReady();
    },

    onChangeFile: function(event) {
      var $title = this.$('.asset-title');

      // Default 'title' -- remove C:\fakepath if it is added
      $title.val(this.$('.asset-replace-file')[0].value.replace("C:\\fakepath\\", ""));
    },

    validateInput: function () {
      var reqs = this.$('.required');
      var uploadFile = this.$('.asset-replace-file');
      var validated = true;
      var uploadFileErrormsg = $(uploadFile).prev('label').find('span.error');
      $.each(reqs, function (index, el) {
        var errormsg = $(el).prev('label').find('span.error');
        if (!$.trim($(el).val())) {
          validated = false;
          $(el).addClass('input-error');
          $(errormsg).text(Origin.l10n.t('app.pleaseentervalue'));
        } else {
          $(el).removeClass('input-error');
          $(errormsg).text('');
        }
      });

      if (this.model.isNew() && !uploadFile.val()) {
        validated = false;
        $(uploadFile).addClass('input-error');
        $(uploadFileErrormsg).text(Origin.l10n.t('app.pleaseaddfile'));
      } else {
        $(uploadFile).removeClass('input-error');
        $(uploadFileErrormsg).text('');
      }
      return validated;
    },

    replaceAsset: function() {

      if (!this.validateInput()) {
        Origin.trigger('sidebar:resetButtons');
        return false;
      }

        // If model is new then uploadFile
        // if (this.model.isNew()) {
          this.uploadFile();
        //   // Return false to prevent the page submitting
          return false;
        // } else {
          // Else just update the title, description and tags
          // this.model.save(null, {
          //   error: function(model, response, options) {
          //     Origin.Notify.alert({
          //       type: 'error',
          //       text: Origin.l10n.t('app.errorassetupdate')
          //     });
          //   },
          //   success: function(model, response, options) {
          //     Origin.router.navigateTo('assetManagement');
          //   }
          // })
        // }
    },

    uploadFile: function() {
      var self = this;
      this.$('.asset-form').ajaxSubmit({

        uploadProgress: function(event, position, total, percentComplete) {
          $(".progress-container").css("visibility", "visible");
          var percentVal = percentComplete + '%';
          $(".progress-bar").css("width", percentVal);
          $('.progress-percent').html(percentVal);
        },

        error: function(xhr, status, error) {
          Origin.trigger('sidebar:resetButtons');
          Origin.Notify.alert({
            type: 'error',
            text: xhr.responseJSON.message
          });
        },

        success: function(data, status, xhr) {
          Origin.trigger('assets:replace');

          self.model.set({_id: data._id});
          self.model.fetch().done(function (data) {
            Origin.trigger('assetItemView:preview', self.model);
          });

          Origin.router.navigateTo('assetManagement');
        }
      });

      // Return false to prevent the page submitting
      return false;
    },


  }, {
    template: 'assetManagementReplaceAsset'
  });

  return AssetManagementReplaceAssetView;

});
