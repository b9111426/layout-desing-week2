const gulp =require('gulp')
const $ = require('gulp-load-plugins')()
const sass = require('gulp-sass')(require('sass'))
const autoprefixer = require('autoprefixer')
const browserSync = require('browser-sync').create()
const minimist = require('minimist')

const envOptions = {
	string: 'env',
	default: { env: 'develop' }
}

const options = minimist(process.argv.slice(2), envOptions)

gulp.task('minify',()=>{
	return gulp
		.src('./app/**/*.html')
		.pipe($.plumber())
		.pipe($.htmlmin({ collapseWhitespace: true }))
		.pipe(gulp.dest('./dist'))
		.pipe(browserSync.stream())
})


/* --- SCSS 編譯 --- */
gulp.task('scss', function () {
	return gulp
		.src('./app/stylesheets/**/*.scss')
		.pipe($.plumber())
		.pipe($.sourcemaps.init())
		.pipe(sass({
			outputStyle: 'expanded',
			includePaths: ['./node_modules/bootstrap/scss']
		}).on('error', sass.logError))
		.pipe($.postcss([autoprefixer()]))// 加入 CSS Prefix
		.pipe($.if(options.env === 'production', $.cleanCss()))// 執行壓縮
		.pipe($.sourcemaps.write())
		.pipe(gulp.dest('./dist/stylesheets/'))
		.pipe(browserSync.stream())
})

/* --- js 編譯 --- */
gulp.task('babel', ()=>{
	return gulp.src('./app/js/**/*.js')
		.pipe($.plumber())
		.pipe($.sourcemaps.init())
		.pipe($.babel())
		.pipe($.concat('all.js'))
		.pipe($.if(options.env === 'production', $.uglify({  //清除console.log
			compress: {
				drop_console: true   
			}
		})))
		.pipe($.sourcemaps.write())
		.pipe(gulp.dest('./dist/js/'))
		.pipe(browserSync.stream())
})

gulp.task('watch', function () {
	gulp.watch(['./app/**/*.html','./app/components/**/*.html'], gulp.series('minify'))
	gulp.watch('./app/stylesheets/**/*.scss', gulp.series('scss'))
	gulp.watch('./app/js/**/*.js', gulp.series('babel'))
})

gulp.task('clean', function () {
	return gulp.src(['./dist'], { read: false, allowEmpty: true })
		.pipe($.clean())
})

gulp.task('imageMin', () =>
	gulp.src('./app/asset/images/*')
		.pipe($.if(options.env === 'production', $.imagemin()))
		.pipe(gulp.dest('./dist/images'))
)

gulp.task('browser-sync', function () {
	browserSync.init({
		server: {
			baseDir: './dist'
		}
	})
})
gulp.task('deploy', function () {
	return gulp.src('./dist/**/*')
		.pipe($.ghPages())
})

gulp.task('build',gulp.series('clean',gulp.parallel('minify','scss' ,'babel','imageMin')))
gulp.task('default',gulp.parallel('minify','scss' ,'babel','watch','browser-sync'))