package org.zetkin.lyra.backend.plugins.git

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.apache.sshd.common.config.keys.FilePasswordProvider
import org.apache.sshd.common.util.io.resource.PathResource
import org.apache.sshd.common.util.security.SecurityUtils
import org.eclipse.jgit.api.Git
import org.eclipse.jgit.api.TransportConfigCallback
import org.eclipse.jgit.transport.SshTransport
import org.eclipse.jgit.transport.sshd.SshdSessionFactoryBuilder
import java.io.File
import java.nio.file.Path
import java.lang.System.getProperty
import org.zetkin.lyra.backend.env
import org.zetkin.lyra.backend.logger

abstract class GitClient(
    private val sshKeyPath: Path = env("SSH_KEY_FILE")
        ?.let { Path.of(getProperty("user.home"), ".ssh", it) }
        ?: Path.of(getProperty("user.home"), ".ssh", "id_rsa"),
) {
    data class PullRequestData(
        val title: String,
        val body: String? = null,
        /**
         * The name of the branch where your changes are (e.g. "feature/foo").
         */
        val head: String,
        /**
         * The name of the branch you want to merge into.
         */
        val base: String = "main",
    )

    data class PullRequestResult(val id: Int, val url: String)

    private val log = logger()

    private val sshSessionFactory by lazy {
        check(sshKeyPath.toFile().exists()) { "SSH key not found at $sshKeyPath" }
        log.info("Using SSH key: $sshKeyPath")
        SshdSessionFactoryBuilder()
            .setPreferredAuthentications("publickey")
            .setHomeDirectory(File(getProperty("user.home")))
            .setSshDirectory(File(getProperty("user.home"), ".ssh"))
            .setDefaultKeysProvider { _ ->
                SecurityUtils.getKeyPairResourceParser()
                    .loadKeyPairs(null, PathResource(sshKeyPath), FilePasswordProvider.EMPTY)
                    ?: emptyList()
            }
            .build(null)
    }

    private val transportConfigCallback = TransportConfigCallback { transport ->
        if (transport is SshTransport) {
            transport.sshSessionFactory = sshSessionFactory
        }
    }

    /**
     * Clone a repository to the given local path.
     * @return the checked-out commit id (SHA) after clone
     */
    suspend fun clone(repositoryUrl: String, targetDir: Path, branch: String? = null): String =
        withContext(Dispatchers.IO) {
            Git.cloneRepository()
                .setURI(repositoryUrl)
                .setDirectory(targetDir.toFile())
                .apply { if (branch != null) setBranch(branch) }
                .setTransportConfigCallback(transportConfigCallback)
                .call()
                .use { git -> git.repository.resolve("HEAD").name }
        }

    /**
     * Fetch updates from remotes for the repository at [targetDir].
     */
    suspend fun fetch(targetDir: Path): Unit = withContext(Dispatchers.IO) {
        Git.open(targetDir.toFile()).use { git ->
            git.fetch()
                .setTransportConfigCallback(transportConfigCallback)
                .call()
        }
    }

    suspend fun checkout(targetDir: Path, branchName: String): Unit = withContext(Dispatchers.IO) {
        Git.open(targetDir.toFile()).use { git ->
            git.checkout()
                .setName(branchName)
                .call()
        }
    }

    /**
     * Pull changes from the remote into the repository at [targetDir].
     * @return the new HEAD commit id after pull
     */
    suspend fun pull(targetDir: Path, branchName: String): String = withContext(Dispatchers.IO) {
        Git.open(targetDir.toFile()).use { git ->
            git.checkout().setName(branchName).call()
            git.pull()
                .setTransportConfigCallback(transportConfigCallback)
                .call()
            git.repository.resolve("HEAD").name
        }
    }

    /**
     * Create a new branch in the repository at [targetDir]. Optionally checkout and/or push it.
     * @return the new branch name
     */
    suspend fun createBranch(
        targetDir: Path,
        branchName: String,
        checkout: Boolean = true,
        push: Boolean = false,
    ): String = withContext(Dispatchers.IO) {
        Git.open(targetDir.toFile()).use { git ->
            git.branchCreate().setName(branchName).call()
            if (checkout) {
                git.checkout().setName(branchName).call()
            }
            if (push) {
                git.push()
                    .setRemote("origin")
                    .add(branchName)
                    .setTransportConfigCallback(transportConfigCallback)
                    .call()
            }
            branchName
        }
    }

    /**
     * Push local commits to remote.
     * @param remote remote name (default: "origin")
     * @param branch branch name to push (if null, pushes the current branch)
     */
    suspend fun push(targetDir: Path, remote: String = "origin", branch: String? = null): Unit =
        withContext(Dispatchers.IO) {
            Git.open(targetDir.toFile()).use { git ->
                val ref = branch ?: git.repository.branch
                git.push()
                    .setRemote(remote)
                    .add(ref)
                    .setTransportConfigCallback(transportConfigCallback)
                    .call()
            }
        }

    /**
     * Returns the current HEAD commit SHA for the repository at [targetDir].
     */
    suspend fun getHead(targetDir: Path): String = withContext(Dispatchers.IO) {
        Git.open(targetDir.toFile()).use { git ->
            git.repository.resolve("HEAD").name
        }
    }

    /**
     * Stage all changes and create a commit in the repository at [targetDir].
     * @return the SHA of the created commit
     */
    suspend fun commit(targetDir: Path, message: String): String = withContext(Dispatchers.IO) {
        Git.open(targetDir.toFile()).use { git ->
            git.add().addFilepattern(".").call()
            val gitUserName = env("GIT_USER_NAME") ?: "Lyra Translator Bot"
            val gitUserEmail = env("GIT_USER_EMAIL") ?: "lyra@zetkin.org"
            val commit = git.commit()
                .setMessage(message)
                .setSign(false)
                .setAuthor(gitUserName, gitUserEmail)
                .call()
            commit.name
        }
    }

    /**
     * Create a pull request on the hosting platform for the given repository.
     *
     * @param repoOwner e.g. "zetkin"
     * @param repositoryName e.g. "lyra"
     * @param pr data for the PR (title, body, head, base)
     * @param token personal access token with repo permissions
     * @return a [PullRequestResult] containing created PR metadata
     */
    abstract suspend fun createPullRequest(
        repoOwner: String,
        repositoryName: String,
        pr: PullRequestData,
        token: String,
    ): PullRequestResult
}
