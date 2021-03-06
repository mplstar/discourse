module("Discourse.Utilities");

var utils = Discourse.Utilities;

test("emailValid", function() {
  ok(utils.emailValid('Bob@example.com'), "allows upper case in the first part of emails");
  ok(utils.emailValid('bob@EXAMPLE.com'), "allows upper case in the email domain");
});


var validUpload = utils.validateFilesForUpload;

test("validateFilesForUpload", function() {
  ok(!validUpload(null), "no files are invalid");
  ok(!validUpload(undefined), "undefined files are invalid");
  ok(!validUpload([]), "empty array of files is invalid");
});

test("uploading one file", function() {
  this.stub(bootbox, "alert");

  ok(!validUpload([1, 2]));
  ok(bootbox.alert.calledWith(Em.String.i18n('post.errors.too_many_uploads')));
});

test("new user", function() {
  Discourse.SiteSettings.newuser_max_images = 0;
  this.stub(Discourse.User, 'current').withArgs("trust_level").returns(0);
  this.stub(bootbox, "alert");

  ok(!validUpload([1]));
  ok(bootbox.alert.calledWith(Em.String.i18n('post.errors.upload_not_allowed_for_new_user')));
});

test("ensures an authorized upload", function() {
  var html = { name: "unauthorized.html" };
  var extensions = Discourse.SiteSettings.authorized_extensions.replace(/\|/g, ", ");
  this.stub(bootbox, "alert");

  ok(!validUpload([html]));
  ok(bootbox.alert.calledWith(Em.String.i18n('post.errors.upload_not_authorized', { authorized_extensions: extensions })));
});

test("prevents files that are too big from being uploaded", function() {
  var image = { name: "image.png", size: 10 * 1024 };
  Discourse.SiteSettings.max_upload_size_kb = 5;
  this.stub(bootbox, "alert");

  ok(!validUpload([image]));
  ok(bootbox.alert.calledWith(Em.String.i18n('post.errors.upload_too_large', { max_size_kb: 5 })));
});

var dummyBlob = function() {
  window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
  if (window.BlobBuilder) {
    var bb = new window.BlobBuilder();
    bb.append([1]);
    return bb.getBlob("image/png");
  } else {
    return new Blob([1], { "type" : "image\/png" });
  }
};

test("allows valid uploads to go through", function() {
  Discourse.SiteSettings.max_upload_size_kb = 15;
  this.stub(bootbox, "alert");

  // image
  var image = { name: "image.png", size: 10 * 1024 };
  ok(validUpload([image]));
  // pasted image
  var pastedImage = dummyBlob();
  ok(validUpload([pastedImage]));

  ok(!bootbox.alert.calledOnce);
});

var isAuthorized = function (filename) {
  return utils.isAuthorizedUpload({ name: filename });
};

test("isAuthorizedUpload", function() {
  ok(isAuthorized("image.png"));
  ok(isAuthorized("image.jpg"));
  ok(!isAuthorized("image.txt"));
  ok(!isAuthorized(""));
});
