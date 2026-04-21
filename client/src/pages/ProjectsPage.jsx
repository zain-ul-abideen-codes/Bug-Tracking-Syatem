import { useEffect, useState } from "react";
import { getUsers } from "../api/usersApi";
import { createProject, deleteProject, getProjects, updateProject } from "../api/projectsApi";
import useAuth from "../hooks/useAuth";
import useModal from "../hooks/useModal";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ProjectModal from "../components/modals/ProjectModal";

export default function ProjectsPage() {
  const { user } = useAuth();
  const projectModal = useModal();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canManageProjects = ["administrator", "manager"].includes(user.role);

  const loadPage = async () => {
    try {
      setLoading(true);
      const [projectData, userData] = await Promise.all([
        getProjects(),
        canManageProjects ? getUsers() : Promise.resolve([]),
      ]);
      setProjects(projectData);
      setUsers(userData);
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const openCreate = () => {
    setSelectedProject(null);
    projectModal.openModal();
  };

  const openEdit = (project) => {
    setSelectedProject(project);
    projectModal.openModal();
  };

  const submitProject = async (payload) => {
    if (selectedProject) {
      await updateProject(selectedProject._id, payload);
    } else {
      await createProject(payload);
    }
    projectModal.closeModal();
    await loadPage();
  };

  const handleDelete = async (id) => {
    await deleteProject(id);
    await loadPage();
  };

  if (loading) return <LoadingSpinner label="Loading projects..." />;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Projects</h2>
          <p>Track assignments for managers, QA engineers, and developers.</p>
        </div>
        {canManageProjects ? <Button onClick={openCreate}>Create Project</Button> : null}
      </div>
      {error ? <p className="server-error">{error}</p> : null}
      <div className="project-grid">
        {projects.map((project) => (
          <article className="project-card" key={project._id}>
            <h3>{project.title}</h3>
            <p>{project.description || "No description provided."}</p>
            <dl className="meta-list">
              <div>
                <dt>Manager</dt>
                <dd>{project.manager?.name || "Unassigned"}</dd>
              </div>
              <div>
                <dt>QA</dt>
                <dd>{project.qaEngineers.map((member) => member.name).join(", ") || "None"}</dd>
              </div>
              <div>
                <dt>Developers</dt>
                <dd>{project.developers.map((member) => member.name).join(", ") || "None"}</dd>
              </div>
            </dl>
            {canManageProjects ? (
              <div className="card-actions">
                <Button variant="secondary" onClick={() => openEdit(project)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => handleDelete(project._id)}>
                  Delete
                </Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {projectModal.isOpen ? (
        <ProjectModal
          project={selectedProject}
          users={users}
          currentRole={user.role}
          onClose={projectModal.closeModal}
          onSubmit={submitProject}
        />
      ) : null}
    </section>
  );
}
