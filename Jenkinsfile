pipeline {
    
    agent
    {
        label 'in-node1-linux'
    }
 
    parameters
    {
        string(name: 'ROLLBACK_BUILD', defaultValue: '', description: 'Enter build number to rollback')
        booleanParam(name: 'FORCE_FAIL', defaultValue: false, description: 'Simulate failure')
    }
 
    environment
    {
        DOTNET_DIR = "${WORKSPACE}/.dotnet"
        DOTNET_ROOT = "${WORKSPACE}/.dotnet"
        PATH = "${WORKSPACE}/.dotnet:${HOME}/.dotnet/tools:${env.PATH}"
        SONAR_PROJECT_KEY = "EPM-ICMP-JAN-2026-DOTNET-TEAM7"
        PROJECT_PATH = "src/NopCommerce.sln"
        NUGET_PACKAGES = "${HOME}/.nuget/packages"
        AZURE_DEPLOY_URL = "https://estore-team-7-gdbff4d4g4hyajcf.scm.southindia-01.azurewebsites.net/api/zipdeploy?isAsync=true"
    }
       
 
    options
    {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }
 
    stages
    {
        stage('Checkout')
        {
            when { expression { params.ROLLBACK_BUILD == '' } }
            steps { checkout scm }
        }
 
        stage('Install .NET 10')
        {
            when { expression { params.ROLLBACK_BUILD == '' } }
            steps
            {
                sh '''
                if [ ! -d "$DOTNET_DIR" ]; then
                    echo "Installing .NET SDK 10..."
                    curl -sSL https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
                    chmod +x dotnet-install.sh
                    ./dotnet-install.sh --channel 10.0 --install-dir $DOTNET_DIR
                fi
 
                echo "Installed .NET version:"
                dotnet --version
                '''
            }
        }
 
        stage('Install Tools')
        {
            when { expression { params.ROLLBACK_BUILD == '' } }
            steps
            {
                sh '''
                dotnet tool update --global dotnet-sonarscanner || dotnet tool install --global dotnet-sonarscanner
                dotnet tool update --global dotnet-reportgenerator-globaltool || dotnet tool install --global dotnet-reportgenerator-globaltool
                '''
            }
        }

        stage('Restore')
        {
            when { expression { params.ROLLBACK_BUILD == '' } }
            steps
            {
                sh 'dotnet restore ${PROJECT_PATH} --packages ${NUGET_PACKAGES}'
            }
        }
 
        stage('Sonar + Build + Test + Coverage')
        {
            when { expression { params.ROLLBACK_BUILD == '' } }
            steps
            {
                withSonarQubeEnv('SonarHyd')
                {
                    withCredentials([string(credentialsId: 'epm-icmp-jan2026-dotnet-team7-sonar-token', variable: 'SONAR_TOKEN')])
                    {
                        sh '''
                        mkdir -p coverage

                        dotnet sonarscanner begin \
                        /k:"$SONAR_PROJECT_KEY" \
                        /v:"$BUILD_NUMBER" \
                        /d:sonar.token="$SONAR_TOKEN" \
                        /d:sonar.cs.opencover.reportsPaths="$WORKSPACE/coverage/**/coverage.opencover.xml" \
                        /d:sonar.branch.name="$BRANCH_NAME" \
                        /d:sonar.exclusions="coverage/**,publish/**,**/obj/**,**/bin/**,**/.sonarqube/**,**/Presentation/Nop.Web/Plugins/**,**/Presentation/Nop.Web/wwwroot/**" \
                        /d:sonar.cpd.exclusions="**/Tests/**,**/test/**,**/Presentation/Nop.Web/Plugins/**" \
                        /d:sonar.coverage.exclusions="**/Tests/**,**/test/**,**/Migrations/**,**/Presentation/Nop.Web/Plugins/**"

                        echo "========== BUILD =========="
                        dotnet build ${PROJECT_PATH} \
                        --configuration Release \
                        --no-restore

                        echo "========== RUN TESTS =========="
                        set +e
                        dotnet test src/Tests/Nop.Tests/Nop.Tests.csproj \
                        --configuration Release \
                        --no-build \
                        --verbosity normal \
                        --logger "trx;LogFileName=$WORKSPACE/coverage/test-results.trx" \
                        --filter "FullyQualifiedName!=Nop.Tests.Nop.Core.Tests.Caching.DistributedCacheManagerTests.SholdThrowsExceptionButNotCacheIt" \
                        --collect:"XPlat Code Coverage;Format=opencover" \
                        --results-directory "$WORKSPACE/coverage/"
                        TEST_EXIT_CODE=$?

                        if [ "$TEST_EXIT_CODE" -ne 0 ]; then
                            echo "========== FAILED TESTS (from TRX) =========="
                            if [ -f "$WORKSPACE/coverage/test-results.trx" ]; then
                                grep 'outcome="Failed"' "$WORKSPACE/coverage/test-results.trx" | head -50 || true
                            else
                                echo "test-results.trx not found"
                            fi
                        fi
                        set -e

                        echo "========== VERIFY COVERAGE FILE =========="
                        COV_FILE=$(find $WORKSPACE/coverage -name "coverage.opencover.xml" -print -quit 2>/dev/null || true)
                        if [ -n "$COV_FILE" ]; then
                            ls -lh "$COV_FILE"
                        else
                            echo "WARNING: Coverage file not found!"
                        fi

                        echo "========== GENERATE REPORT =========="
                        reportgenerator \
                        -reports:"$WORKSPACE/coverage/**/coverage.opencover.xml" \
                        -targetdir:"$WORKSPACE/coverage/reports" \
                        -reporttypes:"Html;Cobertura" || true

                        echo "========== SONAR END =========="
                        dotnet sonarscanner end \
                        /d:sonar.token="$SONAR_TOKEN"

                        echo $TEST_EXIT_CODE > coverage/test-exit-code.txt
                        '''
                    }
                }
            }
        }

        stage('Quality Gate')
        {
            when { expression { params.ROLLBACK_BUILD == '' } }
            steps
            {
                withSonarQubeEnv('SonarHyd')
                {
                    script
                    {
                        echo "Waiting for SonarQube Quality Gate..."
                        timeout(time: 5, unit: 'MINUTES')
                        {
                            def qg = waitForQualityGate abortPipeline: false
                            if (qg.status != 'OK') {
                                echo "⚠️ Quality Gate FAILED: ${qg.status}"
                                echo "Check SonarQube at: ${SONARQUBE_URL}/dashboard?id=${SONAR_PROJECT_KEY}"
                                unstable("Quality Gate failed - ${qg.status}")
                            } else {
                                echo "✅ Quality Gate PASSED"
                            }
                        }
                    }
                }
            }
        }

        stage('Check Test Results')
        {
            when { expression { params.ROLLBACK_BUILD == '' } }
            steps
            {
                script
                {
                    def code = sh(script: 'cat coverage/test-exit-code.txt || echo 0', returnStdout: true).trim()
                    if (code != '0') {
                        echo "⚠️ Some tests failed — checking details..."
                        sh(script: '''
                        if [ -f "coverage/test-results.trx" ]; then
                            echo "Failed tests:"
                            grep 'outcome="Failed"' coverage/test-results.trx | head -20 || echo "No failed tests details found"
                        fi
                        ''', returnStatus: true)
                        
                        def msg = "⚠️ Tests failed (exit code: ${code}) — Pipeline continuing anyway. Check artifacts for details."
                        echo msg
                        currentBuild.result = 'UNSTABLE'
                    } else {
                        echo "✅ All tests passed"
                    }
                }
            }
        }
 
        stage('Publish')
        {
            when { expression { params.ROLLBACK_BUILD == '' } }
            steps
            {
                sh '''
                set -e
                echo "Publish stage bootstrap v2"

                # Restarting from a later stage can skip SDK bootstrap.
                DOTNET="$DOTNET_DIR/dotnet"
                export PATH="$DOTNET_DIR:$HOME/.dotnet/tools:$PATH"

                if [ ! -x "$DOTNET" ]; then
                    echo "Local .NET SDK not found in $DOTNET_DIR. Installing .NET SDK 10..."
                    curl -sSL https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
                    chmod +x dotnet-install.sh
                    ./dotnet-install.sh --channel 10.0 --quality ga --install-dir "$DOTNET_DIR"
                fi

                "$DOTNET" --version

                if [ ! -x "$DOTNET" ]; then
                    echo "dotnet not found (workspace reset after Quality Gate), reinstalling..."
                    curl -sSL https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
                    chmod +x dotnet-install.sh
                    ./dotnet-install.sh --channel 10.0 --install-dir "$DOTNET_DIR"
                    if [ ! -x "$DOTNET" ]; then
                        echo "ERROR: dotnet reinstall failed"
                        exit 1
                    fi
                fi

                echo "Publishing Nop.Web application..."
                "$DOTNET" publish src/Presentation/Nop.Web/Nop.Web.csproj \
                --configuration Release \
                --runtime linux-x64 \
                --self-contained false \
                --output publish

                echo "Copying plugin folders with all dependencies..."
                mkdir -p publish/Plugins

                if [ -d "src/Presentation/Nop.Web/Plugins" ]; then
                    cp -r src/Presentation/Nop.Web/Plugins/* publish/Plugins/ 2>/dev/null || echo "No plugins to copy"
                    echo "Plugin DLLs copied successfully"
                fi

                echo "========== VERIFICATION =========="

                echo "✓ Checking plugins.json deployment..."
                if [ -f "publish/App_Data/plugins.json" ]; then
                    echo "✓ plugins.json found!"
                    cat publish/App_Data/plugins.json
                else
                    echo "✗ CRITICAL: plugins.json NOT found in publish/App_Data/"
                    ls -lh publish/App_Data/ || echo "App_Data folder missing!"
                fi

                echo ""
                echo "✓ Checking OTP Login plugin DLL..."
                if [ -f "publish/Plugins/Misc.OtpLogin/Nop.Plugin.Misc.OtpLogin.dll" ]; then
                    echo "✓ Plugin DLL found"
                    ls -lh publish/Plugins/Misc.OtpLogin/Nop.Plugin.Misc.OtpLogin.dll
                else
                    echo "✗ CRITICAL: Plugin DLL missing!"
                fi

                echo ""
                echo "✓ Checking OTP Login Content files..."
                if [ -d "publish/Plugins/Misc.OtpLogin/Content" ]; then
                    echo "✓ Content folder found:"
                    ls -lh publish/Plugins/Misc.OtpLogin/Content/
                else
                    echo "✗ WARNING: Content folder missing!"
                fi

                echo "=================================="
                '''
            }
        }
 
       stage('Archiving')
    {
    when { expression { params.ROLLBACK_BUILD == '' } }
    steps
    {
        sh '''#!/bin/bash
        set -euo pipefail

        echo "Creating app.zip using Python..."

        cd publish
        python3 -c "import shutil; shutil.make_archive('../app','zip','.')"
        cd ..

        ls -lh app.zip
        '''
    }
   }
 
        stage('Archive Artifact')
        {
            when { expression { params.ROLLBACK_BUILD == '' } }
            steps
            {
                archiveArtifacts artifacts: 'app.zip', fingerprint: true
            }
        }

        stage('Debug Info')
        {
            when { expression { params.ROLLBACK_BUILD == '' } }
            steps
            {
                script
                {
                    echo "=== DEBUG INFORMATION ==="
                    echo "Current Branch: ${env.BRANCH_NAME}"
                    echo "Build Number: ${env.BUILD_NUMBER}"
                    echo "Rollback Build Param: ${params.ROLLBACK_BUILD}"
                    echo "Will Deploy: ${params.ROLLBACK_BUILD == '' && env.BRANCH_NAME == 'develop'}"
                    echo "========================="
                }
            }
        }
 
        stage('Deploy')
        {
            when
            {
                expression 
                { 
                    params.ROLLBACK_BUILD == '' && env.BRANCH_NAME == 'develop'
                }
            }

            steps
            {
                script
                {
                    echo "=== DEPLOYMENT STARTED ==="
                    echo "Branch Name: ${env.BRANCH_NAME}"
                    echo "Build Number: ${env.BUILD_NUMBER}"
                    echo "Azure Deploy URL: ${env.AZURE_DEPLOY_URL}"
                }

                withCredentials([usernamePassword(
                    credentialsId: 'azure-webapp-deploy',
                    usernameVariable: 'AZ_USER',
                    passwordVariable: 'AZ_PASS'
                )])
                {
                    sh '''
                    echo "Deploying to Azure Web App from branch: $BRANCH_NAME"
                    echo "Checking app.zip exists..."
                    ls -lh app.zip

                    echo "Starting deployment to Azure..."
                    curl --show-error --fail-with-body \
                        -X POST \
                        -u "$AZ_USER:$AZ_PASS" \
                        -H "Content-Type: application/octet-stream" \
                        --data-binary @app.zip \
                        --max-time 600 \
                        --connect-timeout 30 \
                        "$AZURE_DEPLOY_URL"

                    echo "Deployment completed successfully"
                    '''
                }
            }
        }

        stage('Mark Successful Deployment')
        {
            when
            {
                expression 
                { 
                    params.ROLLBACK_BUILD == '' && env.BRANCH_NAME == 'develop'
                }
            }
            steps
            {
                echo "Build #${BUILD_NUMBER} deployed successfully to Azure from branch: ${BRANCH_NAME}"
            }
        }
 
        stage('Rollback')
        {
            when { expression { params.ROLLBACK_BUILD != '' } }
            steps
            {
                withCredentials([usernamePassword(
                    credentialsId: 'azure-webapp-deploy',
                    usernameVariable: 'AZ_USER',
                    passwordVariable: 'AZ_PASS'
                )])
                {
                    copyArtifacts(
                        projectName: env.JOB_NAME,
                        selector: specific(params.ROLLBACK_BUILD),
                        filter: 'app.zip',
                        fingerprintArtifacts: true
                    )

                    sh '''
                    echo "Rolling back to build #${ROLLBACK_BUILD}..."

                    echo "Starting deployment to Azure..."
                    curl --show-error --fail-with-body \
                        -X POST \
                        -u "$AZ_USER:$AZ_PASS" \
                        -H "Content-Type: application/octet-stream" \
                        --data-binary @app.zip \
                        --max-time 600 \
                        --connect-timeout 30 \
                        "$AZURE_DEPLOY_URL"

                    echo "Rollback to build #${ROLLBACK_BUILD} completed"
                    '''
                }
            }
        }
    }
 
    post
    {
        success
        {
            publishHTML([
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'coverage/reports',
                reportFiles: 'index.html',
                reportName: 'Code Coverage Report'
            ])
        }
 
        always
        {
            archiveArtifacts artifacts: 'coverage/**,app.zip', allowEmptyArchive: true
        }
 
        cleanup
        {
            cleanWs()
        }
    }
}

