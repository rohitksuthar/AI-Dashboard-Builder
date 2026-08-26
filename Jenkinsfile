pipeline {
    agent any

    stages {

        stage('Build') {
            steps {
                echo 'FSD project...'

                bat '''
                    if not exist frontend\\index.html exit /b 1
                    if not exist frontend\\css\\style.css exit /b 1
                    if not exist frontend\\js\\main.js exit /b 1
                '''

                echo 'Required project files found.'
            }
        }

        stage('Test') {
            steps {
                echo 'Running basic project checks...'

                bat '''
                    if exist frontend\\index.html (
                        echo index.html found
                    ) else (
                        exit /b 1
                    )

                    if exist frontend\\css\\style.css (
                        echo style.css found
                    ) else (
                        exit /b 1
                    )

                    if exist frontend\\js\\main.js (
                        echo main.js found
                    ) else (
                        exit /b 1
                    )
                '''
            }
        }
    }

    post {

        success {
            bat '''
                echo Jenkins Build Feedback > Feedback.txt
                echo ====================== >> Feedback.txt
                echo Build Number: %BUILD_NUMBER% >> Feedback.txt
                echo Build Status: SUCCESS >> Feedback.txt
                echo Build Date: %DATE% %TIME% >> Feedback.txt
                echo Project Type: FSD >> Feedback.txt
                echo. >> Feedback.txt
                echo Required project files were found successfully. >> Feedback.txt
                echo Jenkins build completed successfully. >> Feedback.txt
            '''

            bat '''
                git config user.name "Jenkins"
                git config user.email "rohitksuthar35@gmail.com"

                git add Feedback.txt
                git commit -m "Update Jenkins build feedback"
                git push origin main
            '''
        }

        failure {
            bat '''
                echo Jenkins Build Feedback > Feedback.txt
                echo ====================== >> Feedback.txt
                echo Build Number: %BUILD_NUMBER% >> Feedback.txt
                echo Build Status: FAILURE >> Feedback.txt
                echo Build Date: %DATE% %TIME% >> Feedback.txt
                echo Project Type: FSD >> Feedback.txt
                echo. >> Feedback.txt
                echo One or more required project files are missing. >> Feedback.txt
                echo Please check the Jenkins console output. >> Feedback.txt
            '''

            bat '''
                git config user.name "Jenkins"
                git config user.email "rohitksuthar35@gmail.com"

                git add Feedback.txt
                git commit -m "Update Jenkins build feedback"
                git push origin main
            '''
        }
    }
}
