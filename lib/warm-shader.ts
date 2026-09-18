/**
 * Compiles and links a shader pair in the background so the real program can
 * be built from the browser's shader cache without a long main-thread task.
 * With KHR_parallel_shader_compile the driver works off-thread and we only
 * poll for completion; without it this resolves at once and nothing changes.
 */
export function warmShader(vertex: string, fragment: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      const ext = gl?.getExtension("KHR_parallel_shader_compile");
      if (!gl || !ext) return resolve();

      const make = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
      };
      const vs = make(gl.VERTEX_SHADER, vertex);
      const fs = make(gl.FRAGMENT_SHADER, fragment);
      const program = gl.createProgram();
      if (!vs || !fs || !program) return resolve();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      const started = performance.now();
      const done = () => {
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteProgram(program);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        resolve();
      };
      const poll = () => {
        // Never hold the effect back for long if the driver is slow to report.
        if (
          gl.getProgramParameter(program, ext.COMPLETION_STATUS_KHR) ||
          performance.now() - started > 4000
        ) {
          done();
        } else {
          requestAnimationFrame(poll);
        }
      };
      requestAnimationFrame(poll);
    } catch {
      resolve();
    }
  });
}
