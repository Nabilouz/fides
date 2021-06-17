package devtools.controller

import devtools.controller.definition.ApiResponse.{asyncOptionResponse, asyncResponse}
import devtools.controller.definition.{BaseController, GetByUniqueKey, LongPK}
import devtools.domain.{Approval, Registry}
import devtools.exceptions.NoSuchValueException
import devtools.persist.dao.{DAOs, UserDAO}
import devtools.persist.service.{ApprovalService, RegistryService}
import devtools.rating.Evaluator
import devtools.util.FidesYamlProtocols
import net.jcazevedo.moultingyaml.YamlFormat
import org.scalatra.scalate.ScalateSupport
import org.scalatra.swagger.Swagger

import scala.concurrent.{ExecutionContext, Future}
import scala.util.{Failure, Success}
class RegistryController(
  val service: RegistryService,
  val approvalService: ApprovalService,
  val daos: DAOs,
  val swagger: Swagger
)(implicit
  executor: ExecutionContext
) extends BaseController[Registry, Long] with LongPK[Registry] with ScalateSupport with GetByUniqueKey[Registry] {
  val userDAO: UserDAO                 = daos.userDAO
  val yamlFormat: YamlFormat[Registry] = FidesYamlProtocols.RegistryFormat
  val evaluator: Evaluator             = new Evaluator(daos)
  /* Evaluate endpoints */
  get(
    "/evaluate/:fidesKey",
    operation(
      apiOperation[Approval](s"evaluate a single registry and return the approval value")
        .summary("run and store evaluation on the specified system.")
    )
  ) {
    asyncResponse {
      service.findByUniqueKey(requestContext.organizationId, params("fidesKey")).flatMap {
        case Some(s) => evaluator.registryEvaluate(s, requestContext.user.id)
        case None    => Future.failed(NoSuchValueException("fidesKey", params("fidesKey")))
      }
    }
  }

  get(
    "/evaluate/:fidesKey/last",
    operation(
      apiOperation[Approval](s"Current state of the registry approval, if it exists")
        .summary("Return the current approval state of the specified registry.")
    )
  ) {
    asyncOptionResponse {
      service.findByUniqueKey(requestContext.organizationId, params("fidesKey")).flatMap {
        case Some(s) => approvalService.mostRecentRegistry(s.id)
        case None    => Future.failed(NoSuchValueException("fidesKey", params("fidesKey")))
      }
    }
  }

  post(
    "/evaluate/dry-run",
    operation(
      apiOperation[Approval](s"evaluate a the posted registry and return the approval value")
        .summary("Evaluate the posted registry as a 'dry-run' only.")
    )
  ) {
    asyncResponse {
      ingest(request.body, Option(request.getHeader("Content-Type")), inputMergeMap) match {
        case Success(t)         => evaluator.registryDryRun(t, requestContext.user.id)
        case Failure(exception) => Future.failed(exception)
      }
    }
  }
}
