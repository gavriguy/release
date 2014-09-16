var gulp = require('gulp');
var Q = require('q');
var bump = require('gulp-bump');
var git = require('gulp-git');
var fs = require('fs');
var conventionalChangelog = require('conventional-changelog');
var inquirer = require('inquirer');
var pkg = require('pkg');


gulp.task('bump', function() {
  var deferred = Q.defer();
  inquirer.prompt([
  {
    type: "list",
    name: "versionType",
    message: "Version type",
    choices: ['patch', 'minor', 'major']
  }], function(answers) {
    gulp.src('package.json')
    .pipe(bump({type: answers.versionType}))
    .pipe(gulp.dest('./'));
    setTimeout(function() {
      deferred.resolve();
    }, 100);
  });
  return deferred.promise;
})

gulp.task('git-bump', ['bump'], function(){
  var deferred = Q.defer();
  gulp.src('./')
  .pipe(git.add())
  .pipe(git.commit('chore: bump'));
  setTimeout(function() {
    deferred.resolve();
  }, 100);
  return deferred.promise;
})

gulp.task('changelog', ['git-bump'], function(done){
  function changeParsed(err, log){
    if (err) {
      return done(err);
    }
    console.log(log);
    fs.writeFile('CHANGELOG.md', log, done);
  }
  fs.readFile('./package.json', 'utf8', function(err, data){
    var ref$, repository, version;
    ref$ = JSON.parse(data), repository = ref$.repository, version = ref$.version;
    conventionalChangelog({
      repository: repository.url,
      version: version
    }, function(err, log){
      if (err) {
        return done(err);
      }
      console.log(log);
      fs.writeFile('CHANGELOG.md', log, done);
    });
  });
});

gulp.task('release', ['changelog'], function(){
  version = pkg.Package.version
  console.log('version', version);
  return gulp.src('./')
  .pipe(git.add())
  .pipe(git.commit('chore: bump', {args: '--amend'}))
  .pipe(git.tag(version,'', function (err) {
    if (err) throw err;
  }));
})
