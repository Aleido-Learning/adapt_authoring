// LICENCE https://github.com/adaptlearning/adapt_authoring/blob/master/LICENSE
define(function(require){
  var OriginView = require('core/views/originView');
  var Origin = require('core/origin');

  var AssetManagementNewAssetView = OriginView.extend({
    className: 'asset-management-modal-new-asset',

    events: {
      'change .asset-file': 'onChangeFile',
      'click .asset-management-modal-new-asset-close': 'onCloseClicked',
      'click .asset-management-modal-new-asset-upload': 'onUploadClicked',
      'mouseover .asset-use-icon': 'onShowUseInfo',
      'mouseout .asset-use-icon': 'onHideUseInfo'
    },

    permanentDelete: false,
    uses: 'none',

    preRender: function() {
      this.listenTo(Origin, {
        'assetManagement:modal:newAssetOpened': this.remove,
        'assetManagement:newAsset': this.uploadAsset
      });

      this.$('.asset-use-info').html("");
      this.checkUsage();
    },

    onCloseClicked: function(event) {
      event.preventDefault();
      this.remove();
    },

    onUploadClicked: function(event) {
      event.preventDefault();
      this.uploadAsset();
    },

    postRender: function() {
      // tagging
      this.$('#tags_control').selectize({
        create: true,
        labelField: 'title',
        loadingClass: 'selectize-loading',
        load: function(query, callback) {
          $.ajax({
            url: 'api/autocomplete/tag',
            method: 'GET',
            error: callback,
            success: callback
          });
        },
        onItemAdd: this.onAddTag.bind(this),
        onItemRemove: this.onRemoveTag.bind(this),
        searchField: [ 'title' ]
      });

      // Set view to ready
      this.setViewToReady();
    },

    onChangeFile: function(event) {
      var $title = this.$('.asset-title');
      // Default 'title' -- remove C:\fakepath if it is added
      $title.val(this.$('.asset-file')[0].value.replace("C:\\fakepath\\", ""));
    },

    checkUsage: async function() {
      var self = this;
      this.permanentDelete = false;

      await $.ajax({
        url: 'api/asset/uses/' + self.model.get('_id'),
        type: 'GET',
        success: (data) => {
          try {
            let parsed = JSON.parse(data);

            let usageStr = ""; // + parsed.courses.length + ', components: ' + parsed.components.length;
            parsed.courses.forEach(course => {
              usageStr += "<br/><b>" + course.title + "</b><br/>";

              parsed.components.forEach(component => {
                if(component.courseId === course.id) usageStr += "* " + component.title + "<br/>";
              });
            });

            console.log("✅ Parsed JSON:", parsed, parsed.courses.length, parsed.components.length, usageStr);
            this.$('.asset-use-info').html("");

            if(parsed.components.length === 0) {
              this.permanentDelete = true;
              this.$('.asset-use-info').addClass('is-visible');
            } else {
              this.model.set('usage', "");
              this.uses = usageStr;
              this.$('.asset-use-icon').addClass('is-visible');
              this.$('.asset-use-info').addClass('hover');
            }
            this.model.set('usage', this.uses);
            this.$('.asset-use-info').html(this.uses);

          } catch (e) {
            console.error("Failed to parse JSON:", e);
          }

        },
        error: (data) => {
          Origin.Notify.alert({
            type: 'error',
            text: Origin.l10n.t('app.errorrestoreasset', { message: data.message })
          });
        }
      });
    },

    onShowUseInfo: function() {
      this.$('.asset-use-info').addClass('is-visible');
    },

    onHideUseInfo: function() {
      this.$('.asset-use-info').removeClass('is-visible');
    },

    validateInput: function () {
      var $uploadFile = this.$('.asset-file');
      var validated = true;
      var $uploadFileErrormsg = $uploadFile.prev('label').find('span.error');

      $.each(this.$('.required'), function (index, el) {
        var $errormsg = $(el).prev('label').find('span.error');
        if (!$.trim($(el).val())) {
          validated = false;
          $(el).addClass('input-error');
          $errormsg.text(Origin.l10n.t('app.pleaseentervalue'));
        } else {
          $(el).removeClass('input-error');
          $errormsg.text('');
        }
      });

      if(!$uploadFile.val()) {
        validated = false;
        $uploadFile.addClass('input-error');
        $uploadFileErrormsg.text(Origin.l10n.t('app.pleaseaddfile'));
      } else {
        $uploadFile.removeClass('input-error');
        $uploadFileErrormsg.text('');
      }

      return validated;
    },

    uploadAsset: function() {
      if (!this.validateInput()) {
        return false;
      }
      var title = this.$('.asset-title').val();
      var description = this.$('.asset-description').val();
        // If model is new then uploadFile
        if (this.model.isNew()) {
          this.uploadFile();
          // Return false to prevent the page submitting
          return false;
        } else {
          // Else just update the title, description and tags
          this.model.set({title: title, description: description});
          this.model.save(null, {
            error: function(model, response, options) {
              Origin.Notify.alert({
                type: 'error',
                text: Origin.l10n.t('app.errorassetupdate')
              });
            },
            success: _.bind(function(model, response, options) {
              Origin.trigger('assetManagement:collection:refresh', true);
              this.remove();
            }, this)
          })
        }

    },

    uploadFile: function() {
      // fix tags
      var tags = [];
      _.each(this.model.get('tags'), function (item) {
        item._id && tags.push(item._id);
      });
      this.$('#tags').val(tags);

      this.$('.asset-form').ajaxSubmit({
        uploadProgress: function(event, position, total, percentComplete) {
          $(".progress-container").css("visibility", "visible");
          var percentVal = percentComplete + '%';
          $(".progress-bar").css("width", percentVal);
          $('.progress-percent').html(percentVal);
        },
        error: function(xhr, status, error) {
          Origin.Notify.alert({
            type: 'error',
            text: xhr.responseJSON.message
          });
        },
        success: _.bind(function(data, status, xhr) {
          Origin.once('assetManagement:assetManagementCollection:fetched', function() {
            Origin.trigger('assetManagement:modal:selectItem', data._id);
          })
          Origin.trigger('assetManagement:collection:refresh', true);
          this.remove();
        }, this)
      });

      // Return false to prevent the page submitting
      return false;
    },

    onAddTag: function (tag) {
      var model = this.model;
      $.ajax({
        url: 'api/content/tag',
        method: 'POST',
        data: { title: tag }
      }).done(function (data) {
        if (data && data._id) {
          var tags = model.get('tags') || [];
          tags.push({ _id: data._id, title: data.title });
          model.set({ tags: tags });
        }
      });
    },

    onRemoveTag: function (tag) {
      var tags = [];
      _.each(this.model.get('tags'), function (item) {
        if (item.title !== tag) {
          tags.push(item);
        }
      });
      this.model.set({ tags: tags });
    }
  }, {
    template: 'assetManagementModalNewAsset'
  });

  return AssetManagementNewAssetView;
});
